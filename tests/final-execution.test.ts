import { describe, it, expect } from "vitest";
import { seed, services, calendarExport } from "../src/lib/demo/data";
import {
  validDate,
  duplicateEvent,
  validDemoData,
} from "../src/lib/demo/selectors";
describe("final execution regressions", () => {
  it("rejects impossible persisted calendar dates", () => {
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
    const d = seed();
    d.entries[0].date = "2026-13-01";
    expect(validDemoData(d)).toBe(false);
  });
  it("rejects duplicate events without blocking an edit or another patient", () => {
    const d = seed();
    const e = d.entries.find((e) => e.category === "event")!;
    expect(
      duplicateEvent(d.entries, {
        ...e,
        id: "new",
        title: ` ${e.title.toUpperCase()} `,
      }),
    ).toBe(true);
    expect(duplicateEvent(d.entries, e)).toBe(false);
    expect(duplicateEvent([e], { ...e, id: "new", patient: "different" })).toBe(
      false,
    );
  });
  it("retains one daily completion per patient/activity/date and isolates days", () => {
    let d = seed();
    const e = {
      id: "wellness-log-elder-walking-2026-11-20",
      patient: "elder",
      category: "wellness-log",
      title: "Walking",
      date: "2026-11-20",
      status: "Completed",
      source: "Patient-entered",
    };
    d = services.save(services.save(d, e), e);
    expect(d.entries.filter((x) => x.id === e.id)).toHaveLength(1);
    d = services.save(d, {
      ...e,
      id: "wellness-log-elder-walking-2026-11-19",
      date: "2026-11-19",
    });
    expect(d.entries.filter((x) => x.category === "wellness-log")).toHaveLength(
      2,
    );
  });
  it("seeds adult diabetes context and feeding/growth/walking source observations", () => {
    const d = seed();
    expect(d.patients.find((p) => p.id === "adult")?.conditions).toContain(
      "diabetes",
    );
    for (const title of ["Feeding", "Height", "Head circumference"])
      expect(
        d.entries.some((e) => e.patient === "child" && e.title === title),
      ).toBe(true);
    expect(
      d.entries.some((e) => e.patient === "elder" && e.title === "Walking"),
    ).toBe(true);
  });
  it("exports explicit IST dates and reminders", () => {
    const d = seed();
    const text = calendarExport(
      d.entries.filter((e) => e.category === "event"),
    );
    expect(text).toContain("TZID=Asia/Kolkata");
    expect(text).toContain("BEGIN:VALARM");
  });
});
