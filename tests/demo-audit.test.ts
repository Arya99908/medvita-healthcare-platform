import { describe, it, expect } from "vitest";
import { seed, TODAY, type Entry } from "../src/lib/demo/data";
import {
  measurementRows,
  monthOccurrences,
  upcomingEvents,
  medicationActive,
  isPrivate,
  ageLabel,
  validDemoData,
} from "../src/lib/demo/selectors";
const entry = (extra: Partial<Entry>): Entry => ({
  id: "sample",
  patient: "elder",
  category: "observation",
  title: "Weight",
  date: TODAY,
  status: "Recorded",
  source: "Demonstration data",
  ...extra,
});
describe("presentation audit regression coverage", () => {
  it("keeps numeric chart values paired with their own dates and excludes future records", () => {
    const rows = measurementRows(
      [
        entry({ id: "bad", value: "unknown" }),
        entry({ id: "good", date: "2026-11-19", value: "72.5" }),
        entry({ id: "future", date: "2026-11-25", value: "80" }),
      ],
      "Weight",
      7,
    );
    expect(rows.map((e) => e.id)).toEqual(["good"]);
  });
  it("bounds all analytics ranges at the fixed presentation date", () =>
    expect(
      measurementRows(
        [entry({ value: "72", date: "2026-10-01" }), entry({ value: "73" })],
        "Weight",
        7,
      ),
    ).toHaveLength(1));
  it("expands only occurrences in the agenda month", () => {
    const result = monthOccurrences(
      [
        entry({
          category: "event",
          date: "2026-12-01",
          recurrence: "Daily",
          status: "Scheduled",
        }),
      ],
      "2026-11",
    );
    expect(result).toHaveLength(0);
  });
  it("does not repeat completed or cancelled recurring series", () => {
    for (const status of ["Completed", "Cancelled", "Missed"])
      expect(
        monthOccurrences(
          [
            entry({
              category: "event",
              date: "2026-11-01",
              recurrence: "Daily",
              status,
            }),
          ],
          "2026-11",
        ),
      ).toHaveLength(1);
  });
  it("upcoming lists omit past one-offs and advance recurring series", () => {
    const rows = upcomingEvents([
      entry({
        id: "past",
        category: "event",
        date: "2026-11-01",
        status: "Scheduled",
        recurrence: "None",
      }),
      entry({
        id: "repeat",
        category: "event",
        date: "2026-11-01",
        status: "Scheduled",
        recurrence: "Daily",
      }),
    ]);
    expect(rows.map((e) => e.id)).toEqual(["repeat"]);
    expect(rows[0].date).toBe(TODAY);
  });
  it("honours medication start/end dates without changing prescriptions", () => {
    expect(
      medicationActive(entry({ category: "medication", start: "2026-11-21" })),
    ).toBe(false);
    expect(
      medicationActive(entry({ category: "medication", end: "2026-11-19" })),
    ).toBe(false);
    expect(
      medicationActive(
        entry({ category: "medication", start: TODAY, end: TODAY }),
      ),
    ).toBe(true);
  });
  it("protects sensitive adolescent records even without an explicit old privacy flag", () =>
    expect(
      isPrivate(entry({ patient: "teen", title: "Emotional wellbeing" })),
    ).toBe(true));
  it("computes age by calendar month rather than approximate durations", () => {
    expect(ageLabel("2026-02-20")).toBe("9 months");
    expect(ageLabel("2010-11-21")).toBe("15 years");
  });
  it("rejects malformed persisted data before rendering", () => {
    expect(validDemoData(seed())).toBe(true);
    expect(
      validDemoData({ patients: [{}, {}, {}, {}], entries: [], settings: {} }),
    ).toBe(false);
  });
});
