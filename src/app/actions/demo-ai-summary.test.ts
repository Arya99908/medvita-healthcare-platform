import { afterEach, describe, expect, it, vi } from "vitest";
import { generateDemoSummary } from "./demo-ai-summary";

const { generateTextMock, createClientMock } = vi.hoisted(() => ({ generateTextMock: vi.fn(), createClientMock: vi.fn() }));
vi.mock("ai", () => ({ generateText: generateTextMock, Output: { object: vi.fn((value) => value) } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

function stageForm(stage = "infant") {
  const formData = new FormData();
  formData.set("stage", stage);
  return formData;
}

describe("synthetic AI summary action", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns labeled static sample content without provider configuration", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    vi.stubEnv("MEDVITA_AI_MODEL", "");
    const result = await generateDemoSummary({ status: "idle", message: "" }, stageForm());
    expect(result.status).toBe("success");
    expect(result.mode).toBe("sample");
    expect(result.message).toMatch(/no ai provider was called/i);
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("uses structured generation only for authenticated requests and fictional data", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "fictional-test-key");
    vi.stubEnv("MEDVITA_AI_MODEL", "test/provider-model");
    generateTextMock.mockResolvedValue({ output: { overview: "A fictional infant profile has sample feeding notes only.", facts: ["A fictional feeding note is available."] } });
    createClientMock.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) } });
    const result = await generateDemoSummary({ status: "idle", message: "" }, stageForm("infant"));
    expect(result.status).toBe("success");
    expect(result.mode).toBe("ai");
    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({ model: "test/provider-model", prompt: expect.stringContaining("fictionalRecords") }));
    expect(result.message).toMatch(/fictional sample data/i);
  });
});
