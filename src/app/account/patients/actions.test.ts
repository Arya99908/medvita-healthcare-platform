import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createHealthEvent } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

function query(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function eventForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ eventType: "care_note", title: "Fictional sample", description: "Synthetic note", occurredAt: "", visibility: "general", ...values })) form.set(key, value);
  return form;
}

describe("health event server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const profileQuery = query({ data: { id: patientId, life_stage: "adult" }, error: null });
    const relationshipQuery = query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "patient_profiles") return profileQuery;
      if (table === "patient_relationships") return relationshipQuery;
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("requires an authenticated account", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("signed out") });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/sign in/i);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("requires an active writable relationship before inserting", async () => {
    const readOnlyRelationship = query({ data: { status: "active", can_read: true, can_write: false }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? readOnlyRelationship : { insert: vi.fn() });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("health_events");
  });

  it("creates an unverified patient entry through the row-level protected table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result).toEqual({ status: "success", message: "Note saved as an unverified entry." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: patientId,
      title: "Fictional sample",
      source: "patient",
      verification_status: "unverified",
      created_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("allows sensitive visibility only for an adolescent profile", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn() });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm({ visibility: "sensitive_adolescent" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/adolescent profile/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("health_events");
  });
});
