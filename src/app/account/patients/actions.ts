"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type HealthEventFormState = { status: "idle" | "error" | "success"; message: string };
export type AppointmentFormState = HealthEventFormState;
export type AppointmentStatusFormState = HealthEventFormState;
export type MedicationFormState = HealthEventFormState;
export type MedicationStatusFormState = HealthEventFormState;
export type DocumentFormState = HealthEventFormState;
export type CareLogFormState = HealthEventFormState;

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

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
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

const medicationStatusSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  medicationId: z.string().uuid("Choose a valid medicine note."),
  status: z.enum(["active", "historical"]),
});

const appointmentStatusSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  appointmentId: z.string().uuid("Choose a valid appointment."),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

const symptomSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  symptom: z.string().trim().min(2, "Describe the observation briefly.").max(120, "Keep the description under 120 characters."),
  severity: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
  visibility: z.enum(["general", "sensitive_adolescent"]),
});

const feedingSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  feedingType: z.enum(["breastfeeding", "formula", "solid_food", "other"]),
  quantityMl: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,4}(\.\d{1,1})?$/.test(value) && Number(value) <= 2000), "Enter a quantity from 0 to 2,000 ml."),
  durationMinutes: z.coerce.number().int().min(0).max(600).optional().default(0),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
});

const bowelSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  consistency: z.string().trim().max(60, "Keep the consistency under 60 characters.").optional().default(""),
  color: z.string().trim().max(60, "Keep the colour under 60 characters.").optional().default(""),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
});

const vomitingSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  count: z.coerce.number().int().min(1).max(50),
  associatedNotes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
});

const growthSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  weightKg: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,3}(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 200), "Enter a weight greater than 0 and up to 200 kg."),
  heightCm: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,3}(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 250), "Enter a height greater than 0 and up to 250 cm."),
  headCircumferenceCm: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,2}(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 100), "Enter a head measurement greater than 0 and up to 100 cm."),
}).superRefine((value, context) => {
  if (!value.weightKg && !value.heightCm && !value.headCircumferenceCm) context.addIssue({ code: "custom", path: ["weightKg"], message: "Enter at least one measurement." });
});

const vitalRanges = {
  blood_pressure_systolic: { unit: "mmHg", min: 40, max: 300 },
  blood_pressure_diastolic: { unit: "mmHg", min: 20, max: 200 },
  blood_glucose: { unit: "mg/dL", min: 10, max: 1000 },
  weight: { unit: "kg", min: 0.1, max: 400 },
  height: { unit: "cm", min: 30, max: 250 },
  temperature: { unit: "°C", min: 25, max: 45 },
  heart_rate: { unit: "bpm", min: 20, max: 300 },
  oxygen_saturation: { unit: "%", min: 50, max: 100 },
} as const;

const vitalSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  vitalType: z.enum(Object.keys(vitalRanges) as [keyof typeof vitalRanges, ...(keyof typeof vitalRanges)[]]),
  value: z.coerce.number().finite(),
}).superRefine((input, context) => {
  const range = vitalRanges[input.vitalType];
  if (input.value < range.min || input.value > range.max) context.addIssue({ code: "custom", path: ["value"], message: `Enter a value from ${range.min} to ${range.max} ${range.unit}.` });
});

const menstrualSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  periodStart: z.string().trim().refine(isValidDateOnly, "Enter a valid start date."),
  periodEnd: z.string().trim().optional().default("").refine((value) => !value || isValidDateOnly(value), "Enter a valid end date."),
  flowNote: z.string().trim().max(300, "Keep flow notes under 300 characters.").optional().default(""),
  symptomNote: z.string().trim().max(500, "Keep symptom notes under 500 characters.").optional().default(""),
}).superRefine((value, context) => {
  if (value.periodEnd && value.periodEnd < value.periodStart) context.addIssue({ code: "custom", path: ["periodEnd"], message: "End date must be on or after the start date." });
});

const urinationSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  urinationType: z.enum(["wet_diaper", "toilet", "other"]),
  count: z.coerce.number().int().min(1).max(100),
  volumeMl: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,4}(\.\d{1,1})?$/.test(value) && Number(value) > 0 && Number(value) <= 2000), "Enter a quantity greater than 0 and up to 2,000 ml."),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
});

const sleepSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  sleepType: z.enum(["nap", "overnight", "other"]),
  startedAt: z.string().trim().refine(isValidLocalDateTime, "Enter a valid sleep start time."),
  startedAtOffset: z.coerce.number().int().min(-840).max(840),
  endedAt: z.string().trim().refine(isValidLocalDateTime, "Enter a valid sleep end time."),
  endedAtOffset: z.coerce.number().int().min(-840).max(840),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
}).superRefine((value, context) => {
  if (localDateTimeToUtc(value.endedAt, value.endedAtOffset) <= localDateTimeToUtc(value.startedAt, value.startedAtOffset)) {
    context.addIssue({ code: "custom", path: ["endedAt"], message: "End time must be after the start time." });
  }
});

const vaccinationSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  vaccineName: z.string().trim().min(2, "Enter the vaccine name.").max(100),
  doseLabel: z.string().trim().max(60).optional().default(""),
  status: z.enum(["planned", "administered", "cancelled"]),
  dueOn: z.string().trim().optional().default("").refine((value) => !value || isValidDateOnly(value), "Enter a valid due date."),
  administeredOn: z.string().trim().optional().default("").refine((value) => !value || isValidDateOnly(value), "Enter a valid administration date."),
  documentId: z.string().trim().optional().default("").refine((value) => !value || z.string().uuid().safeParse(value).success, "Choose a valid vaccination document."),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
}).superRefine((value, context) => {
  if (value.status === "planned" && !value.dueOn) context.addIssue({ code: "custom", path: ["dueOn"], message: "Add a due date for a planned vaccination." });
  if (value.status === "administered" && !value.administeredOn) context.addIssue({ code: "custom", path: ["administeredOn"], message: "Add the administration date for a completed vaccination." });
});

const milestoneSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  milestoneName: z.string().trim().min(2, "Enter the milestone or observation.").max(100),
  domain: z.enum(["motor", "communication", "cognitive", "social_emotional", "self_care", "other"]),
  status: z.enum(["observed", "not_observed", "follow_up"]),
  recordedOn: z.string().trim().refine(isValidDateOnly, "Enter a valid observation date."),
  followUpOn: z.string().trim().optional().default("").refine((value) => !value || isValidDateOnly(value), "Enter a valid follow-up date."),
  notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
}).superRefine((value, context) => {
  if (value.status === "follow_up" && !value.followUpOn) context.addIssue({ code: "custom", path: ["followUpOn"], message: "Add a follow-up date for this observation." });
});

const documentSchema = z.object({
  patientId: z.string().uuid("Choose a valid patient profile."),
  displayName: z.string().trim().min(2, "Enter a short document label.").max(80, "Keep the label under 80 characters.").refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Remove control characters from the document label."),
  documentType: z.enum(["care_summary", "test_result", "prescription_copy", "vaccination_certificate", "other"]),
  documentDate: z.string().trim().optional().default("").refine((value) => !value || isValidLocalDateTime(`${value}T00:00`), "Enter a valid document date."),
  visibility: z.enum(["general", "sensitive_adolescent"]),
});

const documentMimeTypes = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

async function hasMatchingFileSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (file.type === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  return false;
}

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

export async function createSymptomObservation(patientId: string, _previous: HealthEventFormState, formData: FormData): Promise<HealthEventFormState> {
  const parsed = symptomSchema.safeParse({
    patientId,
    symptom: formData.get("symptom"),
    severity: formData.get("severity"),
    notes: formData.get("notes") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the symptom details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before adding an observation." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }
  if (parsed.data.visibility === "sensitive_adolescent" && profile.life_stage !== "adolescent") {
    return { status: "error", message: "Sensitive adolescent observations require an adolescent profile." };
  }

  const { error } = await supabase.from("symptom_observations").insert({
    patient_id: patientId,
    symptom: parsed.data.symptom,
    severity: parsed.data.severity,
    notes: parsed.data.notes || null,
    visibility: parsed.data.visibility,
    created_by: user.id,
  });
  if (error) return { status: "error", message: "The observation could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Self-reported observation saved as unverified." };
}

export async function createFeedingRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = feedingSchema.safeParse({ patientId, feedingType: formData.get("feedingType"), quantityMl: formData.get("quantityMl") ?? "", durationMinutes: formData.get("durationMinutes") ?? "0", notes: formData.get("notes") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the feeding details and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a care log." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const { error } = await supabase.from("feeding_records").insert({ patient_id: patientId, feeding_type: parsed.data.feedingType, quantity_ml: parsed.data.quantityMl ? Number(parsed.data.quantityMl) : null, duration_minutes: parsed.data.durationMinutes || null, notes: parsed.data.notes || null, created_by: user.id });
  if (error) return { status: "error", message: "The feeding log could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Feeding log saved as a caregiver or patient report." };
}

export async function createBowelMovementRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = bowelSchema.safeParse({ patientId, consistency: formData.get("consistency") ?? "", color: formData.get("color") ?? "", notes: formData.get("notes") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the care log and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a care log." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const { error } = await supabase.from("bowel_movement_records").insert({ patient_id: patientId, consistency: parsed.data.consistency || null, color: parsed.data.color || null, notes: parsed.data.notes || null, created_by: user.id });
  if (error) return { status: "error", message: "The care log could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Care log saved as a caregiver or patient report." };
}

export async function createVomitingRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = vomitingSchema.safeParse({ patientId, count: formData.get("count"), associatedNotes: formData.get("associatedNotes") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the care log and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a care log." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const { error } = await supabase.from("vomiting_records").insert({ patient_id: patientId, count: parsed.data.count, associated_notes: parsed.data.associatedNotes || null, created_by: user.id });
  if (error) return { status: "error", message: "The care log could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Care log saved as a caregiver or patient report." };
}

export async function createGrowthRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = growthSchema.safeParse({ patientId, weightKg: formData.get("weightKg") ?? "", heightCm: formData.get("heightCm") ?? "", headCircumferenceCm: formData.get("headCircumferenceCm") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the measurements and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving measurements." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const { error } = await supabase.from("growth_records").insert({ patient_id: patientId, weight_kg: parsed.data.weightKg ? Number(parsed.data.weightKg) : null, height_cm: parsed.data.heightCm ? Number(parsed.data.heightCm) : null, head_circumference_cm: parsed.data.headCircumferenceCm ? Number(parsed.data.headCircumferenceCm) : null, created_by: user.id });
  if (error) return { status: "error", message: "The growth record could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Measurements saved as an unverified report." };
}

export async function createVitalRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = vitalSchema.safeParse({ patientId, vitalType: formData.get("vitalType"), value: formData.get("value") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the reading and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a reading." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  const isAdultStage = profile && ["adult", "senior"].includes(profile.life_stage);
  const isChildTemperature = profile && ["infant", "child"].includes(profile.life_stage) && parsed.data.vitalType === "temperature";
  if (profileError || relationshipError || !profile || (!isAdultStage && !isChildTemperature) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Adults and seniors can add vital readings; infant and child profiles can record temperature only." };
  const range = vitalRanges[parsed.data.vitalType];
  const role = relationship.relationship_role;
  const source = role === "patient" ? "patient" : role === "doctor" ? "clinician" : "caregiver";
  const { error } = await supabase.from("vitals").insert({ patient_id: patientId, vital_type: parsed.data.vitalType, value: parsed.data.value, unit: range.unit, source, verification_status: "unverified", created_by: user.id });
  if (error) return { status: "error", message: "The reading could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Reading saved as an unverified report." };
}

export async function createMenstrualRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = menstrualSchema.safeParse({ patientId, periodStart: formData.get("periodStart"), periodEnd: formData.get("periodEnd") ?? "", flowNote: formData.get("flowNote") ?? "", symptomNote: formData.get("symptomNote") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the cycle notes and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a private journal entry." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || profile.life_stage !== "adolescent" || relationship?.relationship_role !== "patient" || relationship.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "Only the adolescent account with active write access can add private cycle notes." };
  }
  const { error } = await supabase.from("menstrual_records").insert({
    patient_id: patientId,
    period_start: parsed.data.periodStart,
    period_end: parsed.data.periodEnd || null,
    flow_note: parsed.data.flowNote || null,
    symptom_note: parsed.data.symptomNote || null,
    visibility: "sensitive_adolescent",
    created_by: user.id,
  });
  if (error) return { status: "error", message: "The private journal entry could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Private cycle note saved. It remains subject to the profile's consent settings." };
}

export async function createUrinationRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = urinationSchema.safeParse({ patientId, urinationType: formData.get("urinationType"), count: formData.get("count"), volumeMl: formData.get("volumeMl") ?? "", notes: formData.get("notes") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the urination log and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a care log." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const role = relationship.relationship_role;
  const source = role === "patient" ? "patient" : role === "doctor" ? "clinician" : "caregiver";
  const { error } = await supabase.from("urination_records").insert({ patient_id: patientId, urination_type: parsed.data.urinationType, count: parsed.data.count, volume_ml: parsed.data.volumeMl ? Number(parsed.data.volumeMl) : null, notes: parsed.data.notes || null, source, verification_status: "unverified", created_by: user.id });
  if (error) return { status: "error", message: "The care log could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Urination log saved as an unverified report." };
}

export async function createSleepRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = sleepSchema.safeParse({ patientId, sleepType: formData.get("sleepType"), startedAt: formData.get("startedAt"), startedAtOffset: formData.get("startedAtOffset") ?? "0", endedAt: formData.get("endedAt"), endedAtOffset: formData.get("endedAtOffset") ?? "0", notes: formData.get("notes") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the sleep times and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a care log." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const role = relationship.relationship_role;
  const source = role === "patient" ? "patient" : role === "doctor" ? "clinician" : "caregiver";
  const { error } = await supabase.from("sleep_records").insert({ patient_id: patientId, sleep_type: parsed.data.sleepType, started_at: new Date(localDateTimeToUtc(parsed.data.startedAt, parsed.data.startedAtOffset)).toISOString(), ended_at: new Date(localDateTimeToUtc(parsed.data.endedAt, parsed.data.endedAtOffset)).toISOString(), notes: parsed.data.notes || null, source, verification_status: "unverified", created_by: user.id });
  if (error) return { status: "error", message: "The sleep log could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Sleep log saved as an unverified report." };
}

export async function createVaccinationRecord(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = vaccinationSchema.safeParse({
    patientId,
    vaccineName: formData.get("vaccineName"),
    doseLabel: formData.get("doseLabel") ?? "",
    status: formData.get("status"),
    dueOn: formData.get("dueOn") ?? "",
    administeredOn: formData.get("administeredOn") ?? "",
    documentId: formData.get("documentId") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the vaccination details and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a vaccination record." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  if (parsed.data.documentId) {
    const { data: document, error: documentError } = await supabase.from("medical_documents").select("id").eq("id", parsed.data.documentId).eq("patient_id", patientId).maybeSingle();
    if (documentError || !document) return { status: "error", message: "Choose a document linked to this child profile." };
  }
  const role = relationship.relationship_role;
  const source = role === "patient" ? "patient" : role === "doctor" ? "clinician" : "caregiver";
  const { error } = await supabase.from("vaccination_records").insert({
    patient_id: patientId,
    vaccine_name: parsed.data.vaccineName,
    dose_label: parsed.data.doseLabel || null,
    status: parsed.data.status,
    due_on: parsed.data.dueOn || null,
    administered_on: parsed.data.administeredOn || null,
    document_id: parsed.data.documentId || null,
    notes: parsed.data.notes || null,
    source,
    verification_status: "unverified",
    created_by: user.id,
  });
  if (error) return { status: "error", message: "The vaccination record could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Vaccination record saved as an unverified caregiver entry." };
}

export async function createDevelopmentalMilestone(patientId: string, _previous: CareLogFormState, formData: FormData): Promise<CareLogFormState> {
  const parsed = milestoneSchema.safeParse({
    patientId,
    milestoneName: formData.get("milestoneName"),
    domain: formData.get("domain"),
    status: formData.get("status"),
    recordedOn: formData.get("recordedOn"),
    followUpOn: formData.get("followUpOn") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the observation and try again." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before saving a milestone observation." };
  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || !["infant", "child"].includes(profile.life_stage) || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) return { status: "error", message: "Active write access to an infant or child profile is required." };
  const role = relationship.relationship_role;
  const source = role === "patient" ? "patient" : role === "doctor" ? "clinician" : "caregiver";
  const { error } = await supabase.from("developmental_milestones").insert({
    patient_id: patientId,
    milestone_name: parsed.data.milestoneName,
    domain: parsed.data.domain,
    status: parsed.data.status,
    recorded_on: parsed.data.recordedOn,
    follow_up_on: parsed.data.followUpOn || null,
    notes: parsed.data.notes || null,
    source,
    verification_status: "unverified",
    created_by: user.id,
  });
  if (error) return { status: "error", message: "The milestone observation could not be saved. Check your access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Observation saved as an unverified caregiver entry." };
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

export async function updateMedicationStatus(patientId: string, _previous: MedicationStatusFormState, formData: FormData): Promise<MedicationStatusFormState> {
  const parsed = medicationStatusSchema.safeParse({
    patientId,
    medicationId: formData.get("medicationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the medicine note and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before updating this medicine note." };

  const { data: relationship, error: relationshipError } = await supabase.from("patient_relationships")
    .select("status,can_read,can_write")
    .eq("patient_id", parsed.data.patientId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (relationshipError || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }

  const { data, error } = await supabase.from("medication_records")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.medicationId)
    .eq("patient_id", parsed.data.patientId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { status: "error", message: "This medicine note could not be updated. Check your access and try again." };

  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: parsed.data.status === "historical" ? "Medicine note marked as past or stopped." : "Medicine note listed as current." };
}

export async function updateAppointmentStatus(patientId: string, _previous: AppointmentStatusFormState, formData: FormData): Promise<AppointmentStatusFormState> {
  const parsed = appointmentStatusSchema.safeParse({
    patientId,
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the appointment and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before updating this appointment plan." };

  const { data: relationship, error: relationshipError } = await supabase.from("patient_relationships")
    .select("status,can_read,can_write")
    .eq("patient_id", parsed.data.patientId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (relationshipError || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }

  const { data, error } = await supabase.from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.appointmentId)
    .eq("patient_id", parsed.data.patientId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { status: "error", message: "This appointment plan could not be updated. Check your access and try again." };

  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  const message = parsed.data.status === "cancelled" ? "Plan marked canceled in this profile." : parsed.data.status === "completed" ? "Plan marked complete in this profile." : "Plan returned to the scheduled list.";
  return { status: "success", message };
}

export async function uploadPatientDocument(patientId: string, _previous: DocumentFormState, formData: FormData): Promise<DocumentFormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a PDF, JPG, or PNG document." };
  if (file.size > 4 * 1024 * 1024) return { status: "error", message: "The file must be 4 MB or smaller." };
  if (!Object.hasOwn(documentMimeTypes, file.type) || !await hasMatchingFileSignature(file)) return { status: "error", message: "The file type does not match a supported PDF, JPG, or PNG file." };

  const parsed = documentSchema.safeParse({
    patientId,
    displayName: formData.get("displayName"),
    documentType: formData.get("documentType"),
    documentDate: formData.get("documentDate") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the document details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again before uploading a document." };

  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,life_stage").eq("id", parsed.data.patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", parsed.data.patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { status: "error", message: "You do not have active write access to this profile." };
  }
  if (parsed.data.visibility === "sensitive_adolescent" && profile.life_stage !== "adolescent") {
    return { status: "error", message: "Sensitive adolescent documents can only be added to an adolescent profile." };
  }

  const storagePath = `${parsed.data.patientId}/${parsed.data.visibility}/${randomUUID()}.${documentMimeTypes[file.type as keyof typeof documentMimeTypes]}`;
  const storage = supabase.storage.from("medical-documents");
  const { error: uploadError } = await storage.upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { status: "error", message: "The file could not be uploaded. Check this profile’s document permissions and try again." };

  const { error: metadataError } = await supabase.from("medical_documents").insert({
    patient_id: parsed.data.patientId,
    storage_path: storagePath,
    document_type: parsed.data.documentType,
    display_name: parsed.data.displayName,
    document_date: parsed.data.documentDate || null,
    upload_status: "uploaded",
    verification_status: "unverified",
    uploaded_by: user.id,
    visibility: parsed.data.visibility,
  });
  if (metadataError) {
    await storage.remove([storagePath]);
    return { status: "error", message: "The document record could not be saved. Check your access and try again." };
  }

  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Document uploaded as an unverified file." };
}
