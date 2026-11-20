import type { DemoData, Entry } from "./data";
import { TODAY } from "./constants";

export const sensitiveTitles = new Set([
  "Private journal",
  "Menstrual cycle",
  "Emotional wellbeing",
  "Skin & acne",
  "Sexual wellness",
]);
export function isPrivate(e: Entry) {
  return (
    e.private === "true" ||
    (["teen", "teen-boy"].includes(e.patient) && sensitiveTitles.has(e.title))
  );
}
export function inRange(e: Entry, days: number, until = TODAY) {
  const start = new Date(`${until}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return e.date >= start.toISOString().slice(0, 10) && e.date <= until;
}
export function numericValue(e: Entry): number | null {
  const text = (e.value || "").trim();
  if (e.title === "Blood pressure")
    return /^\d{2,3}\/\d{2,3}$/.test(text) ? Number(text.split("/")[0]) : null;
  return /^\d+(\.\d+)?$/.test(text) && Number.isFinite(Number(text))
    ? Number(text)
    : null;
}
export function measurementRows(entries: Entry[], kind: string, days: number) {
  return entries
    .filter(
      (e) =>
        e.category === "observation" &&
        e.title === kind &&
        inRange(e, days) &&
        numericValue(e) !== null,
    )
    .sort((a, b) =>
      `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`),
    );
}
export function medicationActive(e: Entry, day = TODAY) {
  return (
    e.category === "medication" &&
    e.status !== "Discontinued" &&
    (!e.start || e.start <= day) &&
    (!e.end || e.end >= day)
  );
}
export function occursOn(e: Entry, day: string) {
  if (e.date === day) return true;
  if (day < e.date || ["Cancelled", "Completed", "Missed"].includes(e.status))
    return false;
  const delta = Math.round(
    (+new Date(`${day}T12:00:00Z`) - +new Date(`${e.date}T12:00:00Z`)) /
      86400000,
  );
  return (
    e.recurrence === "Daily" ||
    (e.recurrence === "Weekly" && delta % 7 === 0) ||
    (e.recurrence === "Monthly" && day.slice(8) === e.date.slice(8))
  );
}
export function monthOccurrences(entries: Entry[], month: string) {
  const [year, m] = month.split("-").map(Number);
  const count = new Date(year, m, 0).getDate();
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  )
    .flatMap((day) =>
      entries
        .filter((e) => occursOn(e, day))
        .map((e): Entry => ({
          ...e,
          id: `${e.id}@${day}`,
          seriesId: e.id,
          date: day,
          occurrence: day,
        })),
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
export function upcomingEvents(entries: Entry[]) {
  return entries
    .filter((e) => e.category === "event" && e.status === "Scheduled")
    .flatMap((e) => {
      if (e.date >= TODAY) return [e];
      for (let i = 0; i < 370; i++) {
        const d = new Date(`${TODAY}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + i);
        const day = d.toISOString().slice(0, 10);
        if (occursOn(e, day)) return [{ ...e, date: day, seriesDate: e.date }];
      }
      return [];
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
export function ageLabel(dob: string) {
  const birth = new Date(`${dob}T12:00:00Z`),
    today = new Date(`${TODAY}T12:00:00Z`);
  let months =
    (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    birth.getUTCMonth();
  if (today.getUTCDate() < birth.getUTCDate()) months--;
  return months < 24
    ? `${Math.max(0, months)} months`
    : `${Math.floor(months / 12)} years`;
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function duplicateEvent(entries: Entry[], event: Partial<Entry>) {
  return (
    event.category === "event" &&
    entries.some(
      (e) =>
        e.id !== event.id &&
        e.category === "event" &&
        e.patient === event.patient &&
        e.title.trim().toLowerCase() === event.title?.trim().toLowerCase() &&
        e.date === event.date &&
        e.time === event.time,
    )
  );
}
export function validDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== "object") return false;
  const d = value as DemoData;
  return (
    Array.isArray(d.patients) &&
    d.patients.length === 6 &&
    ["child", "child-school", "teen", "teen-boy", "adult", "elder"].every((id) =>
      d.patients.some((p) => p.id === id),
    ) &&
    d.patients.every((p) =>
      [
        "name",
        "initials",
        "age",
        "stage",
        "dob",
        "blood",
        "conditions",
        "allergies",
        "doctor",
        "hospital",
        "history",
        "lifestyle",
        "contact",
      ].every((k) => typeof p[k as keyof typeof p] === "string"),
    ) &&
    Array.isArray(d.entries) &&
    d.entries.every(
      (e) =>
        e &&
        [
          "id",
          "patient",
          "category",
          "title",
          "date",
          "status",
          "source",
        ].every((k) => typeof e[k] === "string") &&
        Object.values(e).every((v) => typeof v === "string") &&
        validDate(e.date),
    ) &&
    !!d.settings &&
    ["language", "theme", "number"].every(
      (k) => typeof d.settings[k as keyof typeof d.settings] === "string",
    ) &&
    ["large", "private", "notifications", "presentation"].every(
      (k) => typeof d.settings[k as keyof typeof d.settings] === "boolean",
    ) &&
    typeof d.selected === "string" &&
    d.patients.some((p) => p.id === d.selected)
  );
}
