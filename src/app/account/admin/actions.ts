"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  doctorId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});
const deletionReviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["ready_for_manual_processing", "retention_review", "declined"]),
  note: z.string().trim().min(5).max(500),
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

export async function reviewAccountDeletionRequest(_previous: ReviewDoctorState, formData: FormData): Promise<ReviewDoctorState> {
  const parsed = deletionReviewSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { status: "error", message: "Choose a review outcome and add a note of at least 5 characters." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in with a platform administrator account to review requests." };

  const { error } = await supabase.rpc("review_account_deletion_request", {
    p_request_id: parsed.data.requestId,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) return { status: "error", message: "This request could not be reviewed. It may have changed or administrator access may be missing." };

  revalidatePath("/account/admin");
  revalidatePath("/account");
  return { status: "success", message: "Review outcome saved. The account and its health records have not been deleted." };
}
