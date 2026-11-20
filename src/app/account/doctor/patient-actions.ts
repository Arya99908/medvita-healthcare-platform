"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const noteSchema = z.object({
  patientId: z.string().uuid(),
  noteKind: z.enum(["consultation", "treatment_plan", "follow_up", "addendum"]),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(8000),
  followUpOn: z.string().trim().optional().default("").refine((value) => !value || isValidDate(value)),
  amendsNoteId: z.union([z.literal(""), z.string().uuid()]).optional().default(""),
}).superRefine((value, context) => {
  if (value.noteKind === "addendum" && !value.amendsNoteId) {
    context.addIssue({ code: "custom", path: ["amendsNoteId"], message: "Select the note this addendum corrects." });
  }
  if (value.noteKind !== "addendum" && value.amendsNoteId) {
    context.addIssue({ code: "custom", path: ["amendsNoteId"], message: "Only an addendum can amend an earlier note." });
  }
});

export type ClinicalNoteState = { status: "idle" | "error" | "success"; message: string };

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function createClinicalNote(_previous: ClinicalNoteState, formData: FormData): Promise<ClinicalNoteState> {
  const parsed = noteSchema.safeParse({
    patientId: formData.get("patientId"),
    noteKind: formData.get("noteKind"),
    title: formData.get("title"),
    body: formData.get("body"),
    followUpOn: formData.get("followUpOn") ?? "",
    amendsNoteId: formData.get("amendsNoteId") ?? "",
  });
  if (!parsed.success) return { status: "error", message: "Check the note fields and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again to add a clinician note." };

  const { data, error } = await supabase.from("clinical_notes").insert({
    patient_id: parsed.data.patientId,
    doctor_user_id: user.id,
    note_kind: parsed.data.noteKind,
    title: parsed.data.title,
    body: parsed.data.body,
    follow_up_on: parsed.data.followUpOn || null,
    amends_note_id: parsed.data.amendsNoteId || null,
  }).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "This note could not be saved. Check that your patient consent is still active." };

  revalidatePath(`/account/doctor/patients/${parsed.data.patientId}`);
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Clinician-authored note added to the patient record." };
}
