"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import type { DemoProfile, LifeStageId } from "@/lib/demo-data";

type CareLogEntry = {
  id: string;
  profileId: LifeStageId;
  kind: string;
  note: string;
  createdAt: string;
};

const storageKey = "medvita-demo-care-logs";
const EMPTY_ENTRIES: CareLogEntry[] = [];
let entriesCache: { raw: string | null; value: CareLogEntry[] } = { raw: null, value: EMPTY_ENTRIES };
const stageOptions: Record<LifeStageId, string[]> = {
  infant: ["Feeding", "Sleep", "Temperature", "Diaper note"],
  child: ["Sleep", "Movement and play", "How I feel", "Family observation"],
  "teen-girl": ["Private wellbeing check-in", "Cycle note · fictional demo", "Sleep", "Movement"],
  "teen-boy": ["Private wellbeing check-in", "Sleep", "Movement", "Skin or hygiene note"],
  adult: ["Blood pressure reading", "Blood glucose reading", "Sleep", "Symptom note"],
  senior: ["Blood pressure reading", "Blood glucose reading", "Hydration", "Mobility or care task"],
};

function getEntriesSnapshot(): CareLogEntry[] {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === entriesCache.raw) return entriesCache.value;
  entriesCache.raw = raw;
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    entriesCache.value = Array.isArray(value) ? value as CareLogEntry[] : EMPTY_ENTRIES;
  } catch {
    entriesCache.value = EMPTY_ENTRIES;
  }
  return entriesCache.value;
}

function subscribeToEntries(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("medvita-demo-care-updated", onChange);
  window.addEventListener("medvita-demo-reset", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("medvita-demo-care-updated", onChange);
    window.removeEventListener("medvita-demo-reset", onChange);
  };
}

export default function DailyCareLog({ profile }: { profile: DemoProfile }) {
  const entries = useSyncExternalStore(subscribeToEntries, getEntriesSnapshot, () => EMPTY_ENTRIES);
  const [kind, setKind] = useState(stageOptions[profile.id][0]);
  const [note, setNote] = useState("");
  const options = stageOptions[profile.id];
  const selectedKind = options.includes(kind) ? kind : options[0];
  const profileEntries = useMemo(() => entries.filter((entry) => entry.profileId === profile.id), [entries, profile.id]);

  function save(next: CareLogEntry[]) {
    const raw = JSON.stringify(next);
    try { window.localStorage.setItem(storageKey, raw); } catch { /* Demo still works for this page session. */ }
    entriesCache = { raw, value: next };
    window.dispatchEvent(new Event("medvita-demo-care-updated"));
  }

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanNote = note.trim();
    if (!cleanNote) return;
    save([{ id: crypto.randomUUID(), profileId: profile.id, kind: selectedKind, note: cleanNote, createdAt: new Date().toISOString() }, ...entries]);
    setNote("");
  }

  return <section className="care-log-panel" aria-labelledby="care-log-title">
    <div className="care-log-heading"><div><span className="micro-label">SYNTHETIC DEMO · SAVED ON THIS DEVICE</span><h3 id="care-log-title">Daily care log</h3><p>Simple, age-aware prompts for {profile.label.toLowerCase()} care.</p></div><span className="care-log-mark"><Check size={17} /></span></div>
    <form className="care-log-form" onSubmit={addEntry}>
      <label><span>What would you like to record?</span><select value={selectedKind} onChange={(event) => setKind(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label><span>Sample observation</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Enter a fictional note or reading" required /></label>
      <button type="submit" className="secondary-button"><Check size={15} /> Save demo log</button>
    </form>
    <p className="care-log-privacy">Do not enter real health details here. This local demo does not sync with a care team.</p>
    {profileEntries.length > 0 && <div className="care-log-list" aria-label={`${profile.name}'s saved demo logs`}>
      {profileEntries.slice(0, 5).map((entry) => <article className="care-log-row" key={entry.id}><div><strong>{entry.kind}</strong><p>{entry.note}</p><small>{new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div><button type="button" aria-label={`Delete ${entry.kind} demo log`} onClick={() => save(entries.filter((item) => item.id !== entry.id))}><Trash2 size={15} /></button></article>)}
    </div>}
  </section>;
}
