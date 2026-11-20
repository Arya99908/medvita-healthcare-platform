"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type InvitationActionState = { status: "idle" | "error" | "success"; message: string; invitationPath?: string };
const emptyState: InvitationActionState = { status: "idle", message: "" };
const invitationSchema = z.object({
  email: z.email().trim().max(254),
  role: z.enum(["caregiver", "family_member", "doctor"]),
  canWrite: z.boolean(),
}).refine((value) => value.role !== "doctor" || !value.canWrite);

export async function createPatientInvitation(patientId: string, _previous: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patientId)) return { ...emptyState, status: "error", message: "This profile could not be verified." };
  const parsed = invitationSchema.safeParse({ email: formData.get("email"), role: formData.get("role"), canWrite: formData.get("canWrite") === "on" });
  if (!parsed.success) return { ...emptyState, status: "error", message: "Enter a valid email and invitation role." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ...emptyState, status: "error", message: "Sign in again to share profile access." };
  const { data, error } = await supabase.rpc("create_patient_invitation", {
    p_patient_id: patientId,
    p_invited_email: parsed.data.email,
    p_relationship_role: parsed.data.role,
    p_can_write: parsed.data.canWrite,
  });
  if (error || !data?.[0]?.invitation_token) return { ...emptyState, status: "error", message: error?.message?.includes("already exists") ? "An active invitation already exists for this email." : error?.message?.includes("verified doctor") ? "Doctor invitations require a verified MedVita professional profile." : "The invitation could not be created. Check access and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  const accessDescription = parsed.data.role === "doctor" ? "read access and clinician-note access for 90 days (no general record edits)" : parsed.data.canWrite ? "read and care-record update access" : "read-only access";
  return { status: "success", message: `Invitation link created with ${accessDescription}. The link expires ${new Date(data[0].invitation_expires_at).toLocaleString()}. Share it only with ${parsed.data.email}.`, invitationPath: `/account/invitations/accept?token=${encodeURIComponent(data[0].invitation_token)}` };
}

export async function revokePatientInvitation(patientId: string, _previous: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const id = z.string().uuid().safeParse(formData.get("invitationId"));
  if (!id.success) return { ...emptyState, status: "error", message: "Select a valid invitation." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ...emptyState, status: "error", message: "Sign in again to manage invitations." };
  const { data, error } = await supabase.rpc("revoke_patient_invitation", { p_invitation_id: id.data });
  if (error || data !== true) return { ...emptyState, status: "error", message: "This invitation could not be revoked. It may already be used or expired." };
  revalidatePath(`/account/patients/${patientId}`);
  return { status: "success", message: "Invitation revoked. Its link can no longer be used." };
}

export async function revokePatientRelationship(patientId: string, _previous: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const id = z.string().uuid().safeParse(formData.get("relationshipId"));
  if (!id.success) return { ...emptyState, status: "error", message: "Select a valid profile relationship." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ...emptyState, status: "error", message: "Sign in again to update profile access." };
  const { data, error } = await supabase.from("patient_relationships").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", id.data).eq("patient_id", patientId).neq("relationship_role", "patient").select("id");
  if (error || !data?.length) return { ...emptyState, status: "error", message: "Access could not be removed. Refresh and try again." };
  revalidatePath(`/account/patients/${patientId}`);
  revalidatePath("/account");
  return { status: "success", message: "Profile access removed." };
}

export async function acceptPatientInvitation(token: string, formData: FormData): Promise<void> {
  const parsed = z.string().regex(/^[0-9a-f]{64}$/i).safeParse(token);
  if (!parsed.success || formData.get("confirm") !== "on") redirect("/account/invitations/invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: patientId, error } = await supabase.rpc("accept_patient_invitation", { p_invitation_token: parsed.data });
  if (error || typeof patientId !== "string") redirect("/account/invitations/invalid");
  revalidatePath("/account");
  redirect(`/account/patients/${patientId}`);
}
