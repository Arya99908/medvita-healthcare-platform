import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { reviewDocumentOCR, saveDocumentOCR } from "./document-ocr-actions";

const { revalidatePathMock } = vi.hoisted(() => ({ revalidatePathMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const documentId = "abababab-abab-4bab-8bab-abababababab";
const extractionId = "bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc";
const userId = "11111111-1111-4111-8111-111111111111";
const initialState = { status: "idle" as const, message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function mockClient({ canWrite = true } = {}) {
  const operations: Array<{ table: string; method: string; value?: unknown }> = [];
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
    from: vi.fn((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ["select", "eq"]) query[method] = vi.fn(() => query);
      query.maybeSingle = vi.fn(async () => table === "medical_documents"
        ? { data: { id: documentId, visibility: "sensitive_adolescent" }, error: null }
        : table === "extracted_document_data"
          ? { data: { id: extractionId, review_status: "pending" }, error: null }
          : { data: { status: "active", can_read: canWrite, can_write: canWrite }, error: null });
      query.insert = vi.fn((value: unknown) => { operations.push({ table, method: "insert", value }); return query; });
      query.update = vi.fn((value: unknown) => { operations.push({ table, method: "update", value }); return query; });
      query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve({ data: { id: extractionId }, error: null }).then(resolve, reject);
      return query;
    }),
  };
  return { client, operations };
}

describe("patient document OCR review actions", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires active write access before saving any OCR output", async () => {
    const { client } = mockClient({ canWrite: false });
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await saveDocumentOCR(initialState, form({ patientId, documentId, recognizedText: "Fictional OCR text" }));
    expect(result).toMatchObject({ status: "error" });
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("saves OCR text as pending and preserves the document privacy scope", async () => {
    const { client, operations } = mockClient();
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await saveDocumentOCR(initialState, form({ patientId, documentId, recognizedText: "Fictional medicine label text" }));
    expect(result.status).toBe("success");
    expect(operations).toContainEqual({ table: "extracted_document_data", method: "insert", value: expect.objectContaining({ patient_id: patientId, document_id: documentId, extracted_fields: { rawText: "Fictional medicine label text", extractionMethod: "on_device_ocr", language: "eng" }, review_status: "pending", visibility: "sensitive_adolescent" }) });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("requires bounded text and a valid review decision", async () => {
    const invalid = await reviewDocumentOCR(initialState, form({ patientId, extractionId, reviewedText: "", reviewStatus: "accepted" }));
    expect(invalid.status).toBe("error");
    const oversized = await saveDocumentOCR(initialState, form({ patientId, documentId, recognizedText: "x".repeat(30_001) }));
    expect(oversized.status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("records review status, reviewer, and corrected text without creating medical records", async () => {
    const { client, operations } = mockClient();
    vi.mocked(createClient).mockResolvedValue(client as never);
    const result = await reviewDocumentOCR(initialState, form({ patientId, extractionId, reviewedText: "Corrected fictional report text", reviewStatus: "accepted" }));
    expect(result.status).toBe("success");
    expect(operations).toContainEqual({ table: "extracted_document_data", method: "update", value: expect.objectContaining({ review_status: "accepted", reviewed_by: userId, extracted_fields: { rawText: "Corrected fictional report text", extractionMethod: "on_device_ocr", language: "eng" } }) });
    expect(client.from).not.toHaveBeenCalledWith("laboratory_results");
    expect(client.from).not.toHaveBeenCalledWith("medication_records");
  });
});
