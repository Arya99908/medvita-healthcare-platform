import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { logWellnessEntry, saveWellnessSuggestion } from "./wellness-actions";

const { revalidatePathMock } = vi.hoisted(() => ({ revalidatePathMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const patientUserId = "11111111-1111-4111-8111-111111111111";
const initial = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function createMock({ canWrite = true, lifeStage = "adult", insertError = null }: { canWrite?: boolean; lifeStage?: string; insertError?: unknown } = {}) {
  const calls: Array<{ table: string; value?: unknown }> = [];
  const fixtures: Record<string, unknown> = {
    patient_relationships: { data: { relationship_role: "patient", status: "active", can_read: true, can_write: canWrite }, error: null },
    patient_profiles: { data: { life_stage: lifeStage }, error: null },
  };
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: patientUserId } }, error: null }) },
    from: vi.fn((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ["select", "eq"]) query[method] = vi.fn(() => query);
      query.maybeSingle = vi.fn(() => Promise.resolve(fixtures[table] ?? { data: null, error: null }));
      query.insert = vi.fn((value: unknown) => { calls.push({ table, value }); return query; });
      query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(insertError ? { data: null, error: insertError } : { data: null, error: null }).then(resolve, reject);
      return query;
    }),
  };
  return { client, calls };
}

describe("account wellness workflows", () => {
  afterEach(() => vi.clearAllMocks());

  it("validates recommendation IDs before creating a Supabase client", async () => {
    const result = await saveWellnessSuggestion(initial, form({ patientId, suggestionId: "untrusted" }));
    expect(result.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires active write access before saving a recommendation", async () => {
    const { client } = createMock({ canWrite: false });
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await saveWellnessSuggestion(initial, form({ patientId, suggestionId: "comfortable-movement" }));
    expect(result.message).toMatch(/active write access/i);
    expect(client.from).not.toHaveBeenCalledWith("wellness_plans");
  });

  it("saves a catalog recommendation with its age note and safety limits", async () => {
    const { client, calls } = createMock({ lifeStage: "senior" });
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await saveWellnessSuggestion(initial, form({ patientId, suggestionId: "comfortable-movement" }));
    const inserted = calls.find((call) => call.table === "wellness_plans")?.value as Record<string, unknown>;
    expect(result.status).toBe("success");
    expect(inserted).toMatchObject({ patient_id: patientId, category: "exercise", source: "patient", status: "active", created_by: patientUserId, visibility: "general" });
    expect(inserted.description).toContain("Older adults");
    expect(inserted.description).toContain("recent fall or surgery");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("does not offer meal recommendations or meal logs as infant care advice", async () => {
    const { client, calls } = createMock({ lifeStage: "infant" });
    vi.mocked(createClient).mockResolvedValue(client as never);
    const planResult = await saveWellnessSuggestion(initial, form({ patientId, suggestionId: "balanced-meal" }));
    const logResult = await logWellnessEntry(initial, form({ patientId, recordType: "meal", mealType: "lunch" }));
    expect(planResult.status).toBe("error");
    expect(logResult.status).toBe("error");
    expect(calls).toHaveLength(0);
  });

  it("saves a structured wellness log without calculating a target", async () => {
    const { client, calls } = createMock();
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await logWellnessEntry(initial, form({ patientId, recordType: "water", amount: "250", amountUnit: "ml", note: "User-entered observation" }));
    expect(result.status).toBe("success");
    expect(calls.find((call) => call.table === "wellness_records")?.value).toMatchObject({ patient_id: patientId, record_type: "water", created_by: patientUserId, visibility: "general", value: { amount: 250, unit: "ml", note: "User-entered observation" } });
  });
});
