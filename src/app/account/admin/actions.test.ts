import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewAccountDeletionRequest, reviewDoctorApplication } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const doctorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const supabase = { auth: { getUser: vi.fn() }, rpc: vi.fn() };
const initialState = { status: "idle" as const, message: "" };

function form(decision: string, reason = "") {
  const data = new FormData();
  data.set("doctorId", doctorId);
  data.set("decision", decision);
  data.set("reason", reason);
  return data;
}

describe("doctor application review action", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires a reason to reject", async () => {
    const result = await reviewDoctorApplication(initialState, form("rejected"));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await reviewDoctorApplication(initialState, form("verified"));
    expect(result.status).toBe("error");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("calls the server-enforced review RPC and refreshes both workspaces", async () => {
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
    supabase.rpc.mockResolvedValue({ error: null });

    const result = await reviewDoctorApplication(initialState, form("rejected", "Registration could not be confirmed"));

    expect(result.status).toBe("success");
    expect(supabase.rpc).toHaveBeenCalledWith("review_doctor_application", {
      p_doctor_id: doctorId, p_decision: "rejected", p_reason: "Registration could not be confirmed",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/account/doctor");
  });
});

describe("account deletion request review action", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires a valid decision and a review note", async () => {
    const data = new FormData();
    data.set("requestId", requestId);
    data.set("decision", "retention_review");
    data.set("note", " ");
    const result = await reviewAccountDeletionRequest(initialState, data);
    expect(result.status).toBe("error");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("uses the admin-only RPC and does not claim that deletion completed", async () => {
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
    supabase.rpc.mockResolvedValue({ error: null });
    const data = new FormData();
    data.set("requestId", requestId);
    data.set("decision", "ready_for_manual_processing");
    data.set("note", "Review retention before processing");

    const result = await reviewAccountDeletionRequest(initialState, data);

    expect(result.status).toBe("success");
    expect(result.message).toMatch(/have not been deleted/i);
    expect(supabase.rpc).toHaveBeenCalledWith("review_account_deletion_request", {
      p_request_id: requestId, p_decision: "ready_for_manual_processing", p_note: "Review retention before processing",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account/admin");
  });
});
