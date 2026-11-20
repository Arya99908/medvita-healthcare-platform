"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const preferenceSchema = z.object({ category: z.enum(["caregiver_task", "appointment_reminder", "medication_reminder"]), enabled: z.enum(["true", "false"]) });

export async function markNotificationRead(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("notificationId"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/account/notifications");
}

export async function updateNotificationPreference(formData: FormData) {
  const parsed = preferenceSchema.safeParse({ category: formData.get("category"), enabled: formData.get("enabled") });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return;
  await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    category: parsed.data.category,
    channel: "in_app",
    enabled: parsed.data.enabled === "true",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,category,channel" });
  revalidatePath("/account/notifications");
  revalidatePath("/account/calendar");
}
