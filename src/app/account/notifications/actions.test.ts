import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markNotificationRead, updateNotificationPreference } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const userId = "11111111-1111-4111-8111-111111111111";
const notificationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const supabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("notification actions", () => {
  afterEach(() => vi.clearAllMocks());

  it("marks only the signed-in user's selected notification as read", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ error: null }),
    };
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    supabase.from.mockReturnValue(query);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    await markNotificationRead(form({ notificationId }));

    expect(supabase.from).toHaveBeenCalledWith("notifications");
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ read_at: expect.any(String) }));
    expect(query.eq).toHaveBeenNthCalledWith(1, "id", notificationId);
    expect(query.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
    expect(query.is).toHaveBeenCalledWith("read_at", null);
    expect(revalidatePath).toHaveBeenCalledWith("/account/notifications");
  });

  it("rejects unsupported notification preference categories before writing", async () => {
    await updateNotificationPreference(form({ category: "emergency", enabled: "false" }));
    expect(createClient).not.toHaveBeenCalled();
  });

  it("saves the in-app care-task preference for the authenticated account", async () => {
    const query = { upsert: vi.fn().mockResolvedValue({ error: null }) };
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    supabase.from.mockReturnValue(query);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    await updateNotificationPreference(form({ category: "caregiver_task", enabled: "false" }));

    expect(supabase.from).toHaveBeenCalledWith("notification_preferences");
    expect(query.upsert).toHaveBeenCalledWith({
      user_id: userId,
      category: "caregiver_task",
      channel: "in_app",
      enabled: false,
      updated_at: expect.any(String),
    }, { onConflict: "user_id,category,channel" });
  });
});
