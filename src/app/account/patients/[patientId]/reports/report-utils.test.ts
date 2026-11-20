import { describe, expect, it } from "vitest";
import { countBy, countByDate, groupByDate, inDateRange } from "./report-utils";

describe("patient report aggregations", () => {
  it("averages same-day values and sorts dates oldest first", () => {
    const points = groupByDate([
      { time: "2026-11-03T12:00:00Z", value: 70 },
      { time: "2026-11-01T12:00:00Z", value: 62 },
      { time: "2026-11-03T14:00:00Z", value: 72 },
    ], (record) => record.time, (record) => record.value);
    expect(points).toEqual([{ date: "2026-11-01", value: 62 }, { date: "2026-11-03", value: 71 }]);
  });

  it("counts symptom labels without discarding tied categories", () => {
    expect(countBy(["headache", "fatigue", "headache"], (item) => item)).toEqual([
      { label: "headache", count: 2 }, { label: "fatigue", count: 1 },
    ]);
  });

  it("sums feeding entries by day rather than averaging them", () => {
    expect(countByDate([{ at: "2026-11-02T08:00:00Z" }, { at: "2026-11-02T12:00:00Z" }, { at: "2026-11-03T08:00:00Z" }], (record) => record.at)).toEqual([
      { date: "2026-11-02", value: 2 }, { date: "2026-11-03", value: 1 },
    ]);
  });

  it("uses an inclusive start and exclusive end for the report window", () => {
    expect(inDateRange("2026-11-01T00:00:00Z", "2026-11-01", "2026-12-01")).toBe(true);
    expect(inDateRange("2026-12-01T00:00:00Z", "2026-11-01", "2026-12-01")).toBe(false);
  });
});
