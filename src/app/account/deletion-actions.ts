"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type DeletionRequestState = { status: "idle" | "success" | "error"; message: string };
const passwordSchema = z.string().min(1, "Enter your password to confirm your identity.").max(256);
const requestIdSchema = z.string().uuid();

export async function requestAccountDeletion(_previous: DeletionRequestState, formData: FormData): Promise<DeletionRequestState> {
  const parsedPassword = passwordSchema.safeParse(formData.get("password"));
  if (!parsedPassword.success) return { status: "error", message: parsedPassword.error.issues[0]?.message ?? "Enter your password." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return { status: "error", message: "Sign in again before requesting account deletion." };

  const { data: reauthenticated, error: reauthenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsedPassword.data });
  if (reauthenticationError || reauthenticated.user?.id !== user.id) {
    return { status: "error", message: "Your password could not be confirmed. Check it and try again." };
  }

  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    reauthenticated_at: new Date().toISOString(),
  });
  if (error) return { status: "error", message: "The request could not be saved. It may already be waiting for review." };

  revalidatePath("/account");
  revalidatePath("/account/admin");
  return { status: "success", message: "Your deletion request was sent for review. Your account and health records have not been deleted." };
}

export async function withdrawAccountDeletionRequest(_previous: DeletionRequestState, formData: FormData): Promise<DeletionRequestState> {
  const parsed = requestIdSchema.safeParse(formData.get("requestId"));
  if (!parsed.success) return { status: "error", message: "Choose a valid request." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "error", message: "Sign in again to withdraw this request." };

  const { data, error } = await supabase.from("account_deletion_requests")
    .update({ status: "withdrawn" }).eq("id", parsed.data).eq("user_id", user.id).eq("status", "requested")
    .select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "This request is no longer waiting and could not be withdrawn." };

  revalidatePath("/account");
  revalidatePath("/account/admin");
  return { status: "success", message: "Your pending deletion request was withdrawn." };
}
