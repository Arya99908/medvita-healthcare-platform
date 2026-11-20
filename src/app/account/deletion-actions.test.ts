import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requestAccountDeletion, withdrawAccountDeletionRequest } from "./deletion-actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const mockSupabase = {
  auth: { getUser: vi.fn(), signInWithPassword: vi.fn() },
  from: vi.fn(),
};
const initialState = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("account deletion request actions", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires a signed-in email account and rejects a wrong password", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "person@example.invalid" } }, error: null });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid credentials" } });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await requestAccountDeletion(initialState, form({ password: "wrong-password" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/password could not be confirmed/i);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("re-confirms the current user, saves a request and never calls a deletion API", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "person@example.invalid" } }, error: null });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockReturnValue({ insert });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await requestAccountDeletion(initialState, form({ password: "correct-password" }));

    expect(result.status).toBe("success");
    expect(result.message).toMatch(/have not been deleted/i);
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: "person@example.invalid", password: "correct-password" });
    expect(mockSupabase.from).toHaveBeenCalledWith("account_deletion_requests");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", reauthenticated_at: expect.any(String) }));
    expect(revalidatePath).toHaveBeenCalledWith("/account/admin");
  });

  it("withdraws only the signed-in user's still-pending request", async () => {
    const query = {
      update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: requestId }, error: null }),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockReturnValue(query);
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await withdrawAccountDeletionRequest(initialState, form({ requestId }));

    expect(result.status).toBe("success");
    expect(query.update).toHaveBeenCalledWith({ status: "withdrawn" });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("status", "requested");
  });
});
