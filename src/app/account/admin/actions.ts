"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  doctorId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

export type ReviewDoctorState = { status: "idle" | "success" | "error"; message: string };

export async function reviewDoctorApplication(_previous: ReviewDoctorState, formData: FormData): Promise<ReviewDoctorState> {
  const parsed = reviewSchema.safeParse({
    doctorId: formData.get("doctorId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success || (parsed.data.decision === "rejected" && !parsed.data.reason?.trim())) {
    return { status: "error", message: "Choose a decision and provide a reason when rejecting an application." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in with a platform administrator account to review applications." };

  const { error } = await supabase.rpc("review_doctor_application", {
    p_doctor_id: parsed.data.doctorId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason?.trim() || null,
  });
  if (error) return { status: "error", message: "The application could not be reviewed. It may have changed or your administrator access may be missing." };

  revalidatePath("/account/admin");
  revalidatePath("/account/doctor");
  return { status: "success", message: parsed.data.decision === "verified" ? "Doctor profile verified." : "Application rejected and reason recorded." };
}
