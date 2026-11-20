import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClinicalNote } from "./patient-actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userId = "11111111-1111-4111-8111-111111111111";
const supabase = { auth: { getUser: vi.fn() }, from: vi.fn() };
const initialState = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("clinician note action", () => {
  afterEach(() => vi.clearAllMocks());

  it("validates note content and requires an original for addenda before creating a client", async () => {
    const result = await createClinicalNote(initialState, form({ patientId, noteKind: "addendum", title: "Correction", body: "Clarification" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects impossible follow-up dates before creating a client", async () => {
    const result = await createClinicalNote(initialState, form({ patientId, noteKind: "follow_up", title: "Review plan", body: "Return for review.", followUpOn: "2026-02-30" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated clinician", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const result = await createClinicalNote(initialState, form({ patientId, noteKind: "consultation", title: "Visit summary", body: "Clinician-entered content" }));
    expect(result.status).toBe("error");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("inserts an immutable clinician-authored note and refreshes patient views", async () => {
    const query = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "note-1" }, error: null }),
    };
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    supabase.from.mockReturnValue(query);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const result = await createClinicalNote(initialState, form({ patientId, noteKind: "follow_up", title: "Review plan", body: "Return for review.", followUpOn: "2026-12-01" }));

    expect(supabase.from).toHaveBeenCalledWith("clinical_notes");
    expect(query.insert).toHaveBeenCalledWith({ patient_id: patientId, doctor_user_id: userId, note_kind: "follow_up", title: "Review plan", body: "Return for review.", follow_up_on: "2026-12-01", amends_note_id: null });
    expect(result.status).toBe("success");
    expect(revalidatePath).toHaveBeenCalledWith(`/account/doctor/patients/${patientId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("reports stale or missing consent when row-level security rejects the insert", async () => {
    const query = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "denied" } }) };
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    supabase.from.mockReturnValue(query);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const result = await createClinicalNote(initialState, form({ patientId, noteKind: "consultation", title: "Visit summary", body: "Clinician-entered content" }));
    expect(result.status).toBe("error");
    expect(result.message).toContain("consent is still active");
  });
});
