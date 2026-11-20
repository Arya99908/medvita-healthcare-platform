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

const application = () => form({
  displayName: "  Dr Example  ", specialty: "Family medicine", organisation: "Clinic",
  registrationNumber: "KA-12345", issuingJurisdiction: "Karnataka Medical Council",
});

describe("doctor profile action", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires professional registration details before creating a client", async () => {
    const result = await saveDoctorProfile(initialState, form({ displayName: "D", specialty: "", organisation: "" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await saveDoctorProfile(initialState, application());
    expect(result.status).toBe("error");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("submits registration details for manual review", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const insertDoctor = vi.fn().mockResolvedValue({ error: null });
    const selectDoctorId = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "doctor-id" }, error: null }) };
    const upsertSubmission = vi.fn().mockResolvedValue({ error: null });
    const updateDoctor = { update: vi.fn(), eq: vi.fn() };
    updateDoctor.update.mockReturnValue(updateDoctor);
    updateDoctor.eq.mockReturnValueOnce(updateDoctor).mockResolvedValue({ error: null });
    let doctorCall = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === "doctors") {
        doctorCall += 1;
        if (doctorCall === 1) return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
        if (doctorCall === 2) return { insert: insertDoctor };
        return doctorCall === 3 ? selectDoctorId : updateDoctor;
      }
      if (table === "doctor_verification_submissions") return { upsert: upsertSubmission };
      return updateDoctor;
    });

    const result = await saveDoctorProfile(initialState, application());

    expect(result.status).toBe("success");
    expect(insertDoctor).toHaveBeenCalledWith({ user_id: userId, display_name: "Dr Example", specialty: "Family medicine", organisation: "Clinic", verification_status: "unverified" });
    expect(upsertSubmission).toHaveBeenCalledWith(expect.objectContaining({ doctor_id: "doctor-id", user_id: userId, registration_number: "KA-12345", issuing_jurisdiction: "Karnataka Medical Council" }), { onConflict: "doctor_id" });
    expect(revalidatePath).toHaveBeenCalledWith("/account/doctor");
  });

  it("does not let a doctor edit a verified profile", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "doctor-id", verification_status: "verified" }, error: null }) });

    const result = await saveDoctorProfile(initialState, application());

    expect(result.status).toBe("error");
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
