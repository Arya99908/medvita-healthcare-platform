"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type HealthEventFormState = { status: "idle" | "error" | "success"; message: string };
export type AppointmentFormState = HealthEventFormState;
export type MedicationFormState = HealthEventFormState;

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function isValidLocalDateTime(value: string) {
  const match = localDateTimePattern.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return year >= 1970 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day && hour < 24 && minute < 60;
}

function localDateTimeToUtc(value: string, offsetMinutes: number) {
  const match = localDateTimePattern.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute] = match.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) + offsetMinutes * 60_000;
}

const eventSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  eventType: z.enum(["care_note", "symptom", "visit", "test_result", "other"]),
  title: z.string().trim().min(2, "Enter a short title.").max(120, "Keep the title under 120 characters."),
  description: z.string().trim().max(2000, "Keep the note under 2,000 characters.").optional().default(""),
  occurredAt: z.string().trim().optional().default("").refine((value) => !value || isValidLocalDateTime(value), "Enter a valid date and time."),
  occurredAtOffset: z.coerce.number().int().min(-840).max(840),
  visibility: z.enum(["general", "sensitive_adolescent"]),
});

const appointmentSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  title: z.string().trim().min(2, "Enter an appointment title.").max(120, "Keep the title under 120 characters."),
  startsAt: z.string().trim().min(1, "Choose a date and time.").refine(isValidLocalDateTime, "Enter a valid date and time."),
  startsAtOffset: z.coerce.number().int().min(-840).max(840),
  endsAt: z.string().trim().optional().default("").refine((value) => !value || isValidLocalDateTime(value), "Enter a valid end time."),
  endsAtOffset: z.coerce.number().int().min(-840).max(840),
  location: z.string().trim().max(200, "Keep the location under 200 characters.").optional().default(""),
}).superRefine((value, context) => {
  if (value.endsAt && localDateTimeToUtc(value.endsAt, value.endsAtOffset) <= localDateTimeToUtc(value.startsAt, value.startsAtOffset)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after the start time." });
  }
});

const medicationSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  medicineName: z.string().trim().min(2, "Enter the medicine name as written on its package or record.").max(120, "Keep the name under 120 characters."),
  genericName: z.string().trim().max(120, "Keep the generic name under 120 characters.").optional().default(""),
  strength: z.string().trim().max(80, "Keep the strength under 80 characters.").optional().default(""),
  route: z.string().trim().max(80, "Keep the route under 80 characters.").optional().default(""),
  instructions: z.string().trim().max(500, "Keep the directions under 500 characters.").optional().default(""),
  status: z.enum(["active", "historical"]),
  visibility: z.enum(["general", "sensitive_adolescent"]),
});

export async function createHealthEvent(patientId: string, _previous: HealthEventFormState, formData: FormData): Promise<HealthEventFormState> {
  const parsed = eventSchema.safeParse({
    patientId,
    eventType: formData.get("eventType"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    occurredAt: formData.get("occurredAt") ?? "",
    occurredAtOffset: formData.get("occurredAtOffset") ?? "0",
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
    ...(parsed.data.occurredAt ? { occurred_at: new Date(localDateTimeToUtc(parsed.data.occurredAt, parsed.data.occurredAtOffset)).toISOString() } : {}),
  });

  if (error) return { status: "error", message: "The note could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Note saved as an unverified entry." };
}

export async function createAppointment(patientId: string, _previous: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const parsed = appointmentSchema.safeParse({
    patientId,
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    startsAtOffset: formData.get("startsAtOffset") ?? "0",
    endsAt: formData.get("endsAt") ?? "",
    endsAtOffset: formData.get("endsAtOffset") ?? "0",
    location: formData.get("location") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the appointment details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before adding an appointment." };

  const { data: relationship, error: relationshipError } = await supabase.from("patient_relationships")
    .select("relationship_role,status,can_read,can_write")
    .eq("patient_id", parsed.data.patientId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (relationshipError || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }

  const { error } = await supabase.from("appointments").insert({
    patient_id: parsed.data.patientId,
    title: parsed.data.title,
    starts_at: new Date(localDateTimeToUtc(parsed.data.startsAt, parsed.data.startsAtOffset)).toISOString(),
    ends_at: parsed.data.endsAt ? new Date(localDateTimeToUtc(parsed.data.endsAt, parsed.data.endsAtOffset)).toISOString() : null,
    location: parsed.data.location || null,
    status: "scheduled",
    source: relationship.relationship_role === "patient" ? "patient" : relationship.relationship_role === "doctor" ? "clinician" : "caregiver",
    created_by: user.id,
    visibility: "general",
  });

  if (error) return { status: "error", message: "The appointment could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Appointment saved." };
}

export async function createMedication(patientId: string, _previous: MedicationFormState, formData: FormData): Promise<MedicationFormState> {
  const parsed = medicationSchema.safeParse({
    patientId,
    medicineName: formData.get("medicineName"),
    genericName: formData.get("genericName") ?? "",
    strength: formData.get("strength") ?? "",
    route: formData.get("route") ?? "",
    instructions: formData.get("instructions") ?? "",
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the medicine details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before adding a medicine note." };

  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", parsed.data.patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", parsed.data.patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }
  if (parsed.data.visibility === "sensitive_adolescent" && profile.life_stage !== "adolescent") {
    return { status: "error", message: "Sensitive adolescent medicine notes can only be added to an adolescent profile." };
  }

  const { error } = await supabase.from("medication_records").insert({
    patient_id: parsed.data.patientId,
    medicine_name: parsed.data.medicineName,
    generic_name: parsed.data.genericName || null,
    strength: parsed.data.strength || null,
    route: parsed.data.route || null,
    instructions: parsed.data.instructions || null,
    status: parsed.data.status,
    visibility: parsed.data.visibility,
    created_by: user.id,
  });

  if (error) return { status: "error", message: "The medicine note could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Medicine note saved as unverified." };
}
