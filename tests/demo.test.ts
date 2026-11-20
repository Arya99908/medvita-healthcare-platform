import { describe, it, expect } from "vitest";
import {
  seed,
  services,
  reportFor,
  calendarExport,
} from "../src/lib/demo/data";
describe("frontend demo data integrity", () => {
  it("seeds four isolated life-stage profiles with age-appropriate measures", () => {
    const d = seed();
    expect(d.patients.map((p) => p.id)).toEqual([
      "child",
      "teen",
      "adult",
      "elder",
    ]);
    expect(
      d.entries.filter(
        (e) => e.patient === "child" && e.title === "Blood pressure",
      ),
    ).toHaveLength(0);
    expect(
      d.entries.filter(
        (e) => e.patient === "elder" && e.category === "medication",
      ),
    ).toHaveLength(2);
  });
  it("updates and deletes only the selected record without mutating the seed", () => {
    const d = seed(),
      original = d.entries[0];
    const changed = services.save(d, { ...original, value: "123" });
    expect(changed.entries.find((e) => e.id === original.id)?.value).toBe(
      "123",
    );
    expect(d.entries[0].value).toBe(original.value);
    expect(
      services
        .remove(changed, original.id)
        .entries.some((e) => e.id === original.id),
    ).toBe(false);
  });
  it("never includes another patient or private adolescent entries in shared reports", () => {
    const d = seed();
    d.entries.push({
      id: "secret",
      patient: "teen",
      category: "observation",
      title: "Private journal",
      date: "2026-11-20",
      status: "Recorded",
      source: "Patient-entered",
      value: "PRIVATE_SENTINEL",
      private: "true",
    });
    const result = reportFor(d.patients[1], d.entries, "Summarise my history");
    expect(result).not.toContain("PRIVATE_SENTINEL");
    expect(result).not.toContain("Amlodipine");
    expect(result).toContain("DEMONSTRATION AI OUTPUT");
  });
  it("answers different demonstration intents using recorded data", () => {
    const d = seed();
    const p = d.patients[3];
    expect(reportFor(p, d.entries, "Show medication schedule")).toContain(
      "Amlodipine",
    );
    expect(reportFor(p, d.entries, "Compare trends")).toContain(
      "Historical comparison",
    );
    expect(reportFor(p, d.entries, "What is missing?")).toContain(
      "Missing information",
    );
  });
  it("exports recurring calendar data with escaped user content", () => {
    const d = seed();
    const event = {
      ...d.entries.find((e) => e.category === "event")!,
      title: "Review, blood; glucose",
      recurrence: "Weekly",
    };
    const ics = calendarExport([event]);
    expect(ics).toContain("SUMMARY:Review\\, blood\\; glucose");
    expect(ics).toContain("RRULE:FREQ=WEEKLY");
    expect(ics).toContain("TZID=Asia/Kolkata");
  });
  it("reset creates fresh seed state without retained edits", () => {
    const d = seed();
    d.patients[0].name = "Changed";
    expect(seed().patients[0].name).toBe("Aarav Sharma");
  });
});
