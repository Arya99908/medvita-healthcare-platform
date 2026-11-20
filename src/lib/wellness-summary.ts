import type { Json } from "@/lib/database.types";

export type WellnessSummaryEntry = {
  plan_id: string | null;
  record_type: string;
  value: Json;
  recorded_at: string;
};

export type WellnessPeriodSummary = { entries: number; activeDays: number; exerciseMinutes: number };

export function getLocalDayKey(value: Date, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDayKey(dayKey: string, amount: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function exerciseMinutes(entry: WellnessSummaryEntry): number {
  if (entry.record_type !== "exercise" || !entry.value || typeof entry.value !== "object" || Array.isArray(entry.value)) return 0;
  const minutes = entry.value.minutes;
  return typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function summarize(entries: WellnessSummaryEntry[], from: string, through: string, timeZone: string): WellnessPeriodSummary {
  const inPeriod = entries.filter((entry) => {
    const day = getLocalDayKey(new Date(entry.recorded_at), timeZone);
    return day >= from && day <= through;
  });
  return {
    entries: inPeriod.length,
    activeDays: new Set(inPeriod.map((entry) => getLocalDayKey(new Date(entry.recorded_at), timeZone))).size,
    exerciseMinutes: inPeriod.reduce((total, entry) => total + exerciseMinutes(entry), 0),
  };
}

export function buildWellnessProgress(
  entries: WellnessSummaryEntry[],
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
) {
  const today = getLocalDayKey(now, timeZone);
  const week = summarize(entries, shiftDayKey(today, -6), today, timeZone);
  const month = summarize(entries, `${today.slice(0, 7)}-01`, today, timeZone);
  const streakDaysByPlan: Record<string, number> = {};

  for (const planId of new Set(entries.map((entry) => entry.plan_id).filter((value): value is string => Boolean(value)))) {
    const days = new Set(entries.filter((entry) => entry.plan_id === planId).map((entry) => getLocalDayKey(new Date(entry.recorded_at), timeZone)));
    let cursor = days.has(today) ? today : shiftDayKey(today, -1);
    let streak = 0;
    while (days.has(cursor) && streak < 365) {
      streak += 1;
      cursor = shiftDayKey(cursor, -1);
    }
    streakDaysByPlan[planId] = streak;
  }

  return { today, week, month, streakDaysByPlan };
}
