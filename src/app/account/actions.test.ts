import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPatientProfile } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockSupabase = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

function profileForm(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe("account profile server action", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires a guardian request confirmation for a minor profile", async () => {
    const result = await createPatientProfile({ status: "idle", message: "" }, profileForm({ displayName: "Aarav Sharma", lifeStage: "child" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/guardian request/i);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates an active self profile through the authenticated RPC", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: "patient-1", error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await createPatientProfile({ status: "idle", message: "" }, profileForm({ displayName: "Rohan Mehta", lifeStage: "adult", dateOfBirth: "1988-04-11" }));

    expect(result).toEqual({ status: "success", message: "Your profile was created." });
    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_patient_profile", expect.objectContaining({ p_display_name: "Rohan Mehta", p_life_stage: "adult", p_guardian_attested: false }));
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("records a minor profile as pending instead of granting record access", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-2" } }, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: "patient-2", error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await createPatientProfile({ status: "idle", message: "" }, profileForm({ displayName: "Anaya Sharma", lifeStage: "infant", guardianAttestation: "on" }));

    expect(result.status).toBe("success");
    expect(result.message).toMatch(/pending review/i);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_patient_profile", expect.objectContaining({ p_life_stage: "infant", p_guardian_attested: true }));
  });

  it("rejects invalid dates before contacting Supabase", async () => {
    const result = await createPatientProfile({ status: "idle", message: "" }, profileForm({ displayName: "Rohan Mehta", lifeStage: "adult", dateOfBirth: "2035-01-01" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/valid date/i);
    expect(createClient).not.toHaveBeenCalled();
  });
});
