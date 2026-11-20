import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockSupabase = { auth: { getUser: vi.fn() }, from: vi.fn() };

describe("private calendar ICS export", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("exports only RLS-visible calendar records as escaped, non-cacheable ICS", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "appointments"
      ? { select: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [{ id: "event-1", patient_id: "patient-1", event_type: "follow_up", title: "Review, with Dr. Green", starts_at: "2026-12-01T03:30:00.000Z", ends_at: "2026-12-01T04:00:00.000Z", location: "Clinic; Room 2", notes: "Bring report\nSecond line", status: "scheduled" }], error: null }) })) })) }
      : { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [{ id: "patient-1", display_name: "Fictional Patient" }], error: null }) })) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const response = await GET();
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(response.headers.get("content-disposition")).toContain("medvita-calendar.ics");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body).toContain("SUMMARY:Review\\, with Dr. Green");
    expect(body).toContain("LOCATION:Clinic\\; Room 2");
    expect(body).toContain("Fictional Patient · scheduled\\nBring report\\nSecond line");
    expect(body).toContain("DTSTART:20261201T033000Z");
    expect(body.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
