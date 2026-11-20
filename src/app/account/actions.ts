"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type PatientProfileFormState = { status: "idle" | "error" | "success"; message: string };

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(100, "Keep the name under 100 characters."),
  lifeStage: z.enum(["infant", "child", "adolescent", "adult", "senior"]),
  dateOfBirth: z.string().trim().optional().default("").refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
  }, "Enter a valid date that is not in the future."),
});

const updateProfileSchema = z.object({
  patientId: z.string().uuid("Profile could not be found."),
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(100, "Keep the name under 100 characters."),
  dateOfBirth: z.string().trim().optional().default("").refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
  }, "Enter a valid date that is not in the future."),
  sexAtBirth: z.enum(["", "female", "male", "intersex", "not_shared"]),
});

export async function createPatientProfile(_previous: PatientProfileFormState, formData: FormData): Promise<PatientProfileFormState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    lifeStage: formData.get("lifeStage"),
    dateOfBirth: formData.get("dateOfBirth") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the profile details and try again." };

  const isMinorStage = ["infant", "child", "adolescent"].includes(parsed.data.lifeStage);
  const guardianAttested = formData.get("guardianAttestation") === "on";
  if (isMinorStage && !guardianAttested) return { status: "error", message: "Confirm the guardian request to continue." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again to create a profile." };

  const { error } = await supabase.rpc("create_patient_profile", {
    p_display_name: parsed.data.displayName,
    p_life_stage: parsed.data.lifeStage,
    p_date_of_birth: parsed.data.dateOfBirth || undefined,
    p_preferred_language: "en",
    p_guardian_attested: guardianAttested,
  });
  if (error) return { status: "error", message: "The profile could not be saved. Check your connection and try again." };

  revalidatePath("/account");
  return { status: "success", message: isMinorStage
    ? "Request saved. It stays pending review, and no care-record access is granted yet."
    : "Your profile was created." };
}

export async function updatePatientProfile(_previous: PatientProfileFormState, formData: FormData): Promise<PatientProfileFormState> {
  const parsed = updateProfileSchema.safeParse({
    patientId: formData.get("patientId"),
    displayName: formData.get("displayName"),
    dateOfBirth: formData.get("dateOfBirth") ?? "",
    sexAtBirth: formData.get("sexAtBirth") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the profile details and try again." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again to update this profile." };

  const { data: relationship, error: relationshipError } = await supabase.from("patient_relationships")
    .select("id")
    .eq("patient_id", parsed.data.patientId)
    .eq("user_id", user.id)
    .eq("relationship_role", "patient")
    .eq("status", "active")
    .eq("can_read", true)
    .eq("can_write", true)
    .maybeSingle();
  if (relationshipError || !relationship) return { status: "error", message: "Only the patient can edit these profile details." };

  const { data: updatedProfile, error } = await supabase.from("patient_profiles").update({
    display_name: parsed.data.displayName,
    date_of_birth: parsed.data.dateOfBirth || null,
    sex_at_birth: parsed.data.sexAtBirth || null,
  }).eq("id", parsed.data.patientId).select("id").maybeSingle();
  if (error || !updatedProfile) return { status: "error", message: "The profile could not be saved. Check your connection and try again." };

  revalidatePath(`/account/patients/${parsed.data.patientId}`);
  revalidatePath("/account");
  return { status: "success", message: "Profile details updated." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
