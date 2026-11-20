export type DatedValue = { date: string; value: number; unit: string; source: string };

export function groupByDate<T>(records: T[], dateOf: (record: T) => string, valueOf: (record: T) => number | null): { date: string; value: number }[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const record of records) {
    const date = dateOf(record).slice(0, 10);
    const value = valueOf(record);
    if (!date || value === null || !Number.isFinite(value)) continue;
    const previous = totals.get(date) ?? { total: 0, count: 0 };
    totals.set(date, { total: previous.total + value, count: previous.count + 1 });
  }
  return [...totals.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([date, values]) => ({ date, value: Number((values.total / values.count).toFixed(2)) }));
}

export function countByDate<T>(records: T[], dateOf: (record: T) => string): { date: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const date = dateOf(record).slice(0, 10);
    if (date) counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([date, value]) => ({ date, value }));
}

export function countBy<T>(records: T[], keyOf: (record: T) => string): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const label = keyOf(record).trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}

export function inDateRange(date: string, from: string, before: string): boolean {
  return date >= from && date < before;
}
