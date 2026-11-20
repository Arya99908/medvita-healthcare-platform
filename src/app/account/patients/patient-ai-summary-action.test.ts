import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { generatePatientAISummary } from "./patient-ai-summary-action";
import { patientSummarySchema } from "@/lib/ai/patient-summary";

const { generateTextMock, revalidatePathMock } = vi.hoisted(() => ({ generateTextMock: vi.fn(), revalidatePathMock: vi.fn() }));
vi.mock("ai", () => ({ generateText: generateTextMock, Output: { object: vi.fn((value) => value) } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const initialState = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("patient-consented AI summary", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("requires explicit patient consent and an allowed date range", async () => {
    const missingConsent = await generatePatientAISummary(initialState, form({ patientId, rangeDays: "90" }));
    const invalidRange = await generatePatientAISummary(initialState, form({ patientId, rangeDays: "20", aiConsent: "on" }));
    expect(missingConsent.status).toBe("error");
    expect(invalidRange.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("does not send patient records when the AI provider is not configured", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    vi.stubEnv("MEDVITA_AI_MODEL", "");
    const result = await generatePatientAISummary(initialState, form({ patientId, rangeDays: "90", aiConsent: "on" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/no patient records were sent/i);
    expect(createClient).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("requires an active, writable patient relationship and denies linked caregivers", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "fictional-test-key");
    vi.stubEnv("MEDVITA_AI_MODEL", "test/provider-model");
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { relationship_role: "caregiver", status: "active", can_read: true, can_write: true }, error: null }),
    };
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "33333333-3333-4333-8333-333333333333" } }, error: null }) },
      from: vi.fn().mockReturnValue(query),
    } as never);
    const result = await generatePatientAISummary(initialState, form({ patientId, rangeDays: "90", aiConsent: "on" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/only the patient account/i);
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("requires every generated observation to cite valid source IDs", () => {
    const valid = patientSummarySchema.safeParse({ summary: "The selected records contain a few reported entries.", observations: [{ text: "A symptom observation was recorded.", sourceIds: [patientId] }], questionsForClinician: [], missingInformation: [] });
    const uncited = patientSummarySchema.safeParse({ summary: "The selected records contain a few reported entries.", observations: [{ text: "A symptom observation was recorded.", sourceIds: [] }], questionsForClinician: [], missingInformation: [] });
    expect(valid.success).toBe(true);
    expect(uncited.success).toBe(false);
  });

  it("loads general records through the user session, records one-time consent, and persists cited sources", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "fictional-test-key");
    vi.stubEnv("MEDVITA_AI_MODEL", "test/provider-model");
    const patientUserId = "22222222-2222-4222-8222-222222222222";
    const sourceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const operations: Array<{ table: string; method: string; value?: unknown }> = [];
    const fixtures: Record<string, { data: unknown; error: null }> = {
      patient_relationships: { data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null },
      patient_profiles: { data: { life_stage: "adult" }, error: null },
      health_events: { data: [{ id: sourceId, event_type: "note", title: "Reported headache", description: null, source: "patient", verification_status: "unverified", occurred_at: "2026-11-20T10:00:00.000Z" }], error: null },
      symptom_observations: { data: [], error: null }, vitals: { data: [], error: null }, medical_conditions: { data: [], error: null },
      allergies: { data: [], error: null }, medication_records: { data: [], error: null }, appointments: { data: [], error: null }, laboratory_results: { data: [], error: null },
      consent_records: { data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, error: null },
      ai_reports: { data: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", created_at: "2026-11-20T10:10:00.000Z" }, error: null },
      ai_analysis_sources: { data: null, error: null },
    };
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: patientUserId } }, error: null }) },
      from: vi.fn((table: string) => {
        const query: Record<string, unknown> = {};
        for (const method of ["select", "eq", "gte", "lte", "order", "limit", "in"]) query[method] = vi.fn(() => query);
        query.maybeSingle = vi.fn(() => Promise.resolve(fixtures[table]));
        query.insert = vi.fn((value: unknown) => { operations.push({ table, method: "insert", value }); return query; });
        query.update = vi.fn((value: unknown) => { operations.push({ table, method: "update", value }); return query; });
        query.delete = vi.fn(() => { operations.push({ table, method: "delete" }); return query; });
        query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(fixtures[table] ?? { data: [], error: null }).then(resolve, reject);
        return query;
      }),
    };
    vi.mocked(createClient).mockResolvedValue(client as never);
    generateTextMock.mockResolvedValue({ output: { summary: "The selected records include one patient-reported observation.", observations: [{ text: "A headache was recorded as a patient report.", sourceIds: [sourceId] }], questionsForClinician: ["What details should I track if this happens again?"], missingInformation: [] } });

    const result = await generatePatientAISummary(initialState, form({ patientId, rangeDays: "90", aiConsent: "on" }));

    expect(result.status).toBe("success");
    expect(result.sources).toEqual([{ id: sourceId, label: "Health event: Reported headache", sourceDate: "2026-11-20T10:00:00.000Z" }]);
    expect(operations.find((item) => item.table === "consent_records" && item.method === "insert")?.value).toMatchObject({ scope: "ai_summary", granted_by: patientUserId, granted_to: patientUserId, status: "active" });
    expect(operations.find((item) => item.table === "ai_reports" && item.method === "insert")?.value).toMatchObject({ report_type: "patient_history_summary", generated_by: patientUserId, visibility: "general" });
    expect(operations.find((item) => item.table === "ai_analysis_sources" && item.method === "insert")?.value).toEqual([expect.objectContaining({ source_record_id: sourceId, report_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" })]);
    expect(operations).toContainEqual({ table: "consent_records", method: "update", value: { status: "expired" } });
    expect(client.from).not.toHaveBeenCalledWith("menstrual_records");
    expect(generateTextMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });
});
