import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPatientInvitation } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const supabase = { auth: { getUser: vi.fn() }, rpc: vi.fn() };
const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function invitationForm(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe("caregiver invitation action", () => {
  afterEach(() => vi.clearAllMocks());

  it("validates the email before reaching Supabase", async () => {
    const result = await createPatientInvitation(patientId, { status: "idle", message: "" }, invitationForm({ email: "invalid", role: "caregiver" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires a signed-in caller", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const result = await createPatientInvitation(patientId, { status: "idle", message: "" }, invitationForm({ email: "family@example.invalid", role: "family_member" }));
    expect(result.status).toBe("error");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("creates an expiring manual link with the selected least-privilege role", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "owner-1" } }, error: null });
    supabase.rpc.mockResolvedValue({ data: [{ invitation_token: "a".repeat(64), invitation_expires_at: "2026-11-27T00:00:00.000Z" }], error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const result = await createPatientInvitation(patientId, { status: "idle", message: "" }, invitationForm({ email: "family@example.invalid", role: "family_member" }));
    expect(supabase.rpc).toHaveBeenCalledWith("create_patient_invitation", { p_patient_id: patientId, p_invited_email: "family@example.invalid", p_relationship_role: "family_member", p_can_write: false });
    expect(result.invitationPath).toContain("/account/invitations/accept?token=");
    expect(result.message).toContain("family@example.invalid");
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("invites a doctor with read-only access and explains its 90-day expiry", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "owner-1" } }, error: null });
    supabase.rpc.mockResolvedValue({ data: [{ invitation_token: "b".repeat(64), invitation_expires_at: "2026-11-27T00:00:00.000Z" }], error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const result = await createPatientInvitation(patientId, { status: "idle", message: "" }, invitationForm({ email: "doctor@example.invalid", role: "doctor" }));

    expect(supabase.rpc).toHaveBeenCalledWith("create_patient_invitation", { p_patient_id: patientId, p_invited_email: "doctor@example.invalid", p_relationship_role: "doctor", p_can_write: false });
    expect(result.message).toContain("clinician-note access for 90 days");
    expect(result.invitationPath).toContain("/account/invitations/accept?token=");
  });

  it("rejects doctor write permission even if a caller forges the form value", async () => {
    const result = await createPatientInvitation(patientId, { status: "idle", message: "" }, invitationForm({ email: "doctor@example.invalid", role: "doctor", canWrite: "on" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });
});
