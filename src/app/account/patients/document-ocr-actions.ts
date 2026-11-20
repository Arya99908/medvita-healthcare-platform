"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type DocumentOCRActionState = { status: "idle" | "error" | "success"; message: string };

const patientIdSchema = z.string().uuid();
const documentIdSchema = z.string().uuid();
const extractedTextSchema = z.string().trim().min(1).max(30_000);
const saveSchema = z.object({ patientId: patientIdSchema, documentId: documentIdSchema, text: extractedTextSchema });
const reviewSchema = z.object({
  patientId: patientIdSchema,
  extractionId: z.string().uuid(),
  text: extractedTextSchema,
  status: z.enum(["accepted", "rejected"]),
});

async function writablePatient(patientId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase, error: "Sign in again before managing document text." } as const;
  const { data: relationship, error } = await supabase.from("patient_relationships")
    .select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle();
  if (error || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { supabase, error: "You need active write access to this profile." } as const;
  }
  return { supabase, user, error: null } as const;
}

export async function saveDocumentOCR(_previous: DocumentOCRActionState, formData: FormData): Promise<DocumentOCRActionState> {
  const parsed = saveSchema.safeParse({ patientId: formData.get("patientId"), documentId: formData.get("documentId"), text: formData.get("recognizedText") });
  if (!parsed.success) return { status: "error", message: "Run OCR and check that extracted text is present and under 30,000 characters." };
  const access = await writablePatient(parsed.data.patientId);
  if (access.error) return { status: "error", message: access.error };
  const { data: document, error: documentError } = await access.supabase.from("medical_documents")
    .select("id,visibility").eq("id", parsed.data.documentId).eq("patient_id", parsed.data.patientId).maybeSingle();
  if (documentError || !document) return { status: "error", message: "This document is unavailable in the selected profile." };
  const { error } = await access.supabase.from("extracted_document_data").insert({
    patient_id: parsed.data.patientId,
    document_id: document.id,
    extracted_fields: { rawText: parsed.data.text, extractionMethod: "on_device_ocr", language: "eng" },
    review_status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    visibility: document.visibility,
  });
  if (error) return { status: "error", message: "The unverified extraction could not be saved. Check your profile access and try again." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "OCR text saved as pending review. It has not been added to the medical record." };
}

export async function reviewDocumentOCR(_previous: DocumentOCRActionState, formData: FormData): Promise<DocumentOCRActionState> {
  const parsed = reviewSchema.safeParse({ patientId: formData.get("patientId"), extractionId: formData.get("extractionId"), text: formData.get("reviewedText"), status: formData.get("reviewStatus") });
  if (!parsed.success) return { status: "error", message: "Review the text and choose whether it is usable." };
  const access = await writablePatient(parsed.data.patientId);
  if (access.error) return { status: "error", message: access.error };
  const { data: extraction, error: extractionError } = await access.supabase.from("extracted_document_data")
    .select("id,review_status").eq("id", parsed.data.extractionId).eq("patient_id", parsed.data.patientId).maybeSingle();
  if (extractionError || !extraction || extraction.review_status !== "pending") {
    return { status: "error", message: "Only a pending extraction can be reviewed. Reload the page and try again." };
  }
  const { data, error } = await access.supabase.from("extracted_document_data")
    .update({ extracted_fields: { rawText: parsed.data.text, extractionMethod: "on_device_ocr", language: "eng" }, review_status: parsed.data.status, reviewed_by: access.user.id, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.extractionId).eq("patient_id", parsed.data.patientId).eq("review_status", "pending").select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "This extraction could not be reviewed. Check your profile access." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: parsed.data.status === "accepted" ? "Text marked reviewed. It remains separate from verified medical records." : "Text marked unusable. It remains separate from verified medical records." };
}
