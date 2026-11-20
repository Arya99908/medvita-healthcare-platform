"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const doctorProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  specialty: z.string().trim().max(100),
  organisation: z.string().trim().max(120),
  registrationNumber: z.string().trim().min(2).max(80),
  issuingJurisdiction: z.string().trim().min(2).max(120),
});

export type DoctorProfileState = { status: "idle" | "success" | "error"; message: string };

export async function saveDoctorProfile(_previous: DoctorProfileState, formData: FormData): Promise<DoctorProfileState> {
  const parsed = doctorProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    specialty: formData.get("specialty") ?? "",
    organisation: formData.get("organisation") ?? "",
    registrationNumber: formData.get("registrationNumber"),
    issuingJurisdiction: formData.get("issuingJurisdiction"),
  });
  if (!parsed.success) return { status: "error", message: "Enter your name and professional registration details within the stated limits." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again to update your professional profile." };

  const { data: existing, error: lookupError } = await supabase.from("doctors")
    .select("id,verification_status").eq("user_id", user.id).limit(1).maybeSingle();
  if (lookupError) return { status: "error", message: "Your professional profile could not be checked. Please retry." };
  if (existing?.verification_status === "verified") {
    return { status: "error", message: "Your verified profile is locked. Contact the clinic administrator for changes." };
  }

  const values = {
    display_name: parsed.data.displayName,
    specialty: parsed.data.specialty || null,
    organisation: parsed.data.organisation || null,
    user_id: user.id,
  };
  const { error } = existing
    ? await supabase.from("doctors").update(values).eq("id", existing.id)
    : await supabase.from("doctors").insert({ ...values, verification_status: "unverified" });
  if (error) return { status: "error", message: "Your profile could not be saved. Please retry." };

  const { data: savedProfile, error: savedProfileError } = await supabase.from("doctors")
    .select("id").eq("user_id", user.id).limit(1).maybeSingle();
  if (savedProfileError || !savedProfile) return { status: "error", message: "Your application could not be prepared. Please retry." };
  const { error: submissionError } = await supabase.from("doctor_verification_submissions").upsert({
    doctor_id: savedProfile.id,
    user_id: user.id,
    registration_number: parsed.data.registrationNumber,
    issuing_jurisdiction: parsed.data.issuingJurisdiction,
    updated_at: new Date().toISOString(),
  }, { onConflict: "doctor_id" });
  if (submissionError) return { status: "error", message: "Your professional details could not be submitted. Please retry." };
  const { error: statusError } = await supabase.from("doctors").update({ verification_status: "pending" })
    .eq("id", savedProfile.id).eq("user_id", user.id);
  if (statusError) return { status: "error", message: "Your details were saved, but the review status could not be updated. Please retry." };

  revalidatePath("/account/doctor");
  return { status: "success", message: "Application submitted. A clinic administrator must check your registration before your profile is verified." };
}
