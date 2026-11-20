"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wellnessSuggestions } from "@/lib/wellness-content";
import { createClient } from "@/lib/supabase/server";

export type WellnessActionState = { status: "idle" | "error" | "success"; message: string };

const patientIdSchema = z.string().uuid();
const planSchema = z.object({ patientId: patientIdSchema, suggestionId: z.string().min(1).max(60) });
const entrySchema = z.object({
  patientId: patientIdSchema,
  planId: z.string().trim().optional().default("").refine((value) => !value || z.string().uuid().safeParse(value).success),
  recordType: z.enum(["exercise", "meal", "water", "habit"]),
  note: z.string().trim().max(500).optional().default(""),
  minutes: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,3}$/.test(value) && Number(value) <= 600)),
  amount: z.string().trim().optional().default("").refine((value) => !value || (/^\d{1,4}(\.\d{1,2})?$/.test(value) && Number(value) <= 5000)),
  amountUnit: z.enum(["ml", "cup", "glass"]).optional().default("ml"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional().default("snack"),
});
const planStatusSchema = z.object({ patientId: patientIdSchema, planId: z.string().uuid(), status: z.enum(["active", "paused", "complete", "archived"]) });

async function getWritablePatient(patientId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sign in again before changing this wellness record." } as const;
  const [{ data: relationship, error: relationshipError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
    supabase.from("patient_profiles").select("life_stage").eq("id", patientId).maybeSingle(),
  ]);
  if (relationshipError || profileError || !profile || relationship?.status !== "active" || !relationship.can_read || !relationship.can_write) {
    return { ok: false, error: "You need active write access to this patient profile." } as const;
  }
  return { ok: true, supabase, user, relationship, profile } as const;
}

export async function saveWellnessSuggestion(_previous: WellnessActionState, formData: FormData): Promise<WellnessActionState> {
  const parsed = planSchema.safeParse({ patientId: formData.get("patientId"), suggestionId: formData.get("suggestionId") });
  if (!parsed.success) return { status: "error", message: "Choose a wellness suggestion and try again." };
  const suggestion = wellnessSuggestions.find((item) => item.id === parsed.data.suggestionId);
  if (!suggestion) return { status: "error", message: "This suggestion is no longer available." };
  const access = await getWritablePatient(parsed.data.patientId);
  if (!access.ok) return { status: "error", message: access.error };
  if (access.profile.life_stage === "infant" && suggestion.id === "balanced-meal") {
    return { status: "error", message: "For infants, use the pediatric feeding record and follow the child's care team." };
  }
  const { error } = await access.supabase.from("wellness_plans").insert({
    patient_id: parsed.data.patientId,
    title: suggestion.title,
    category: suggestion.category,
    description: `${suggestion.why(access.profile.life_stage as Parameters<typeof suggestion.why>[0])} ${suggestion.limitation} Source: ${suggestion.sourceLabel}${suggestion.sourceUrl ? ` (${suggestion.sourceUrl})` : ""}`,
    source: "patient",
    status: "active",
    created_by: access.user.id,
    visibility: "general",
  });
  if (error) return { status: "error", message: "This suggestion could not be saved. Check that your profile access is still active." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  revalidatePath(`/account/patients/${parsed.data.patientId}/reports`);
  return { status: "success", message: "Wellness suggestion saved to this profile." };
}

export async function logWellnessEntry(_previous: WellnessActionState, formData: FormData): Promise<WellnessActionState> {
  const parsed = entrySchema.safeParse({
    patientId: formData.get("patientId"), planId: formData.get("planId") ?? "", recordType: formData.get("recordType"),
    note: formData.get("note") ?? "", minutes: formData.get("minutes") ?? "", amount: formData.get("amount") ?? "",
    amountUnit: formData.get("amountUnit") ?? "ml", mealType: formData.get("mealType") ?? "snack",
  });
  if (!parsed.success) return { status: "error", message: "Check the entry details and try again." };
  const access = await getWritablePatient(parsed.data.patientId);
  if (!access.ok) return { status: "error", message: access.error };
  if (access.profile.life_stage === "infant" && parsed.data.recordType === "meal") {
    return { status: "error", message: "For infant feeding, use the child-care feeding record." };
  }
  const planId: string | null = parsed.data.planId || null;
  if (planId) {
    const { data: plan, error: planError } = await access.supabase.from("wellness_plans").select("id").eq("id", planId).eq("patient_id", parsed.data.patientId).eq("status", "active").maybeSingle();
    if (planError || !plan) return { status: "error", message: "Choose an active wellness goal from this profile." };
  }
  const value: Record<string, string | number> = {};
  if (parsed.data.note) value.note = parsed.data.note;
  if (parsed.data.recordType === "exercise" && parsed.data.minutes) value.minutes = Number(parsed.data.minutes);
  if (parsed.data.recordType === "water" && parsed.data.amount) {
    value.amount = Number(parsed.data.amount);
    value.unit = parsed.data.amountUnit;
  }
  if (parsed.data.recordType === "meal") value.mealType = parsed.data.mealType;
  const { error } = await access.supabase.from("wellness_records").insert({
    patient_id: parsed.data.patientId,
    plan_id: planId,
    record_type: parsed.data.recordType,
    value,
    created_by: access.user.id,
    visibility: "general",
  });
  if (error) return { status: "error", message: "This entry could not be saved. Check that your profile access is still active." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  revalidatePath(`/account/patients/${parsed.data.patientId}/reports`);
  return { status: "success", message: "Wellness entry saved." };
}

export async function updateWellnessPlan(_previous: WellnessActionState, formData: FormData): Promise<WellnessActionState> {
  const parsed = planStatusSchema.safeParse({ patientId: formData.get("patientId"), planId: formData.get("planId"), status: formData.get("status") });
  if (!parsed.success) return { status: "error", message: "Choose a saved wellness goal and try again." };
  const access = await getWritablePatient(parsed.data.patientId);
  if (!access.ok) return { status: "error", message: access.error };
  const { data, error } = await access.supabase.from("wellness_plans").update({ status: parsed.data.status }).eq("id", parsed.data.planId).eq("patient_id", parsed.data.patientId).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "The wellness goal could not be updated. Check your profile access." };
  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  return { status: "success", message: "Wellness goal updated." };
}
