import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockSupabase = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

describe("account data export route", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("returns a non-cacheable download from the RLS-protected export RPC", async () => {
    const exportData = { format_version: 1, account_id: "user-1", tables: { profiles: [] } };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: exportData, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toMatch(/attachment; filename="medvita-account-export-/);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual(exportData);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("export_my_data");
  });
});
