import { describe, expect, it } from "vitest";
import { buildWellnessProgress, type WellnessSummaryEntry } from "./wellness-summary";

const goalId = "11111111-1111-4111-8111-111111111111";
const now = new Date("2026-11-20T05:00:00.000Z");

function entry(recordedAt: string, overrides: Partial<WellnessSummaryEntry> = {}): WellnessSummaryEntry {
  return { plan_id: goalId, record_type: "habit", value: {}, recorded_at: recordedAt, ...overrides };
}

describe("wellness progress summaries", () => {
  it("counts local calendar days, weekly activity, month-to-date logs, and goal streaks", () => {
    const entries = [
      entry("2026-11-20T04:00:00.000Z", { record_type: "exercise", value: { minutes: 25 } }),
      entry("2026-11-19T18:00:00.000Z"),
      entry("2026-11-18T18:00:00.000Z", { plan_id: null, record_type: "exercise", value: { minutes: 10 } }),
      entry("2026-10-31T18:00:00.000Z"),
    ];

    const report = buildWellnessProgress(entries, now, "Asia/Kolkata");

    expect(report.today).toBe("2026-11-20");
    expect(report.week).toEqual({ entries: 3, activeDays: 3, exerciseMinutes: 35 });
    expect(report.month).toEqual({ entries: 3, activeDays: 3, exerciseMinutes: 35 });
    expect(report.streakDaysByPlan[goalId]).toBe(2);
  });

  it("keeps a one-day streak through yesterday but resets after a missed day", () => {
    expect(buildWellnessProgress([entry("2026-11-19T18:00:00.000Z")], now, "Asia/Kolkata").streakDaysByPlan[goalId]).toBe(1);
    expect(buildWellnessProgress([entry("2026-11-18T18:00:00.000Z")], now, "Asia/Kolkata").streakDaysByPlan[goalId]).toBe(0);
  });

  it("ignores invalid, zero, or non-exercise movement durations", () => {
    const entries = [
      entry("2026-11-20T04:00:00.000Z", { record_type: "exercise", value: { minutes: 0 } }),
      entry("2026-11-20T05:00:00.000Z", { record_type: "exercise", value: { minutes: -4 } }),
      entry("2026-11-20T06:00:00.000Z", { record_type: "habit", value: { minutes: 60 } }),
    ];
    expect(buildWellnessProgress(entries, now, "Asia/Kolkata").week.exerciseMinutes).toBe(0);
  });
});
