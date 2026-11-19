"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type HealthEventFormState = { status: "idle" | "error" | "success"; message: string };

const eventSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  eventType: z.enum(["care_note", "symptom", "visit", "test_result", "other"]),
  title: z.string().trim().min(2, "Enter a short title.").max(120, "Keep the title under 120 characters."),
  description: z.string().trim().max(2000, "Keep the note under 2,000 characters.").optional().default(""),
  occurredAt: z.string().trim().optional().default("").refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time."),
  visibility: z.enum(["general", "sensitive_adolescent"]),
});

export async function createHealthEvent(patientId: string, _previous: HealthEventFormState, formData: FormData): Promise<HealthEventFormState> {
  const parsed = eventSchema.safeParse({
    patientId,
    eventType: formData.get("eventType"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    occurredAt: formData.get("occurredAt") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the note details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before adding a note." };

  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", parsed.data.patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", parsed.data.patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }
  if (parsed.data.visibility === "sensitive_adolescent" && profile.life_stage !== "adolescent") {
    return { status: "error", message: "Sensitive adolescent notes can only be added to an adolescent profile." };
  }

  const { error } = await supabase.from("health_events").insert({
    patient_id: parsed.data.patientId,
    event_type: parsed.data.eventType,
    title: parsed.data.title,
    description: parsed.data.description || null,
    source: relationship.relationship_role === "patient" ? "patient" : relationship.relationship_role === "doctor" ? "clinician" : "caregiver",
    verification_status: "unverified",
    visibility: parsed.data.visibility,
    created_by: user.id,
    ...(parsed.data.occurredAt ? { occurred_at: new Date(parsed.data.occurredAt).toISOString() } : {}),
  });

  if (error) return { status: "error", message: "The note could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Note saved as an unverified entry." };
}
