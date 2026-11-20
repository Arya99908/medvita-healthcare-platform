import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveDoctorProfile } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const userId = "11111111-1111-4111-8111-111111111111";
const supabase = { auth: { getUser: vi.fn() }, from: vi.fn() };
const initialState = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function profileLookup(result: { data: unknown; error: null | { message: string } }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  supabase.from.mockReturnValue(query);
  return query;
}

describe("doctor profile action", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects invalid profile data before creating a client", async () => {
    const result = await saveDoctorProfile(initialState, form({ displayName: "D", specialty: "", organisation: "" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await saveDoctorProfile(initialState, form({ displayName: "Dr Example", specialty: "Family medicine", organisation: "Clinic" }));
    expect(result.status).toBe("error");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("creates a new profile as unverified for the signed-in account", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    profileLookup({ data: null, error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })).mockImplementationOnce(() => ({ insert }));

    const result = await saveDoctorProfile(initialState, form({ displayName: "  Dr Example  ", specialty: "Family medicine", organisation: "Clinic" }));

    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith({ user_id: userId, display_name: "Dr Example", specialty: "Family medicine", organisation: "Clinic", verification_status: "unverified" });
    expect(revalidatePath).toHaveBeenCalledWith("/account/doctor");
  });

  it("does not let a doctor edit a verified profile", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    profileLookup({ data: { id: "doctor-id", verification_status: "verified" }, error: null });

    const result = await saveDoctorProfile(initialState, form({ displayName: "Dr Example", specialty: "", organisation: "" }));

    expect(result.status).toBe("error");
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
