"use client";

import { useActionState, useMemo, useState } from "react";
import { Activity, Apple, Check, ChevronDown, CircleHelp, Leaf, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import type { Json } from "@/lib/database.types";
import { wellnessCategoryLabels, wellnessSuggestions, type WellnessCategory, type WellnessStage } from "@/lib/wellness-content";
import { logWellnessEntry, saveWellnessSuggestion, updateWellnessPlan, type WellnessActionState } from "./wellness-actions";
import { createCalendarAppointment, type AppointmentFormState } from "./actions";

type Plan = { id: string; title: string; category: string; description: string | null; status: string; created_at: string };
type Entry = { id: string; plan_id: string | null; record_type: string; value: Json; recorded_at: string };
type Constraint = { name: string };
const initialState: WellnessActionState = { status: "idle", message: "" };
const initialCalendarState: AppointmentFormState = { status: "idle", message: "" };
const categoryIcons: Record<WellnessCategory, typeof Activity> = { exercise: Activity, nutrition: Apple, habit: Leaf };
const categoryOrder: WellnessCategory[] = ["exercise", "nutrition", "habit"];

function jsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function displayEntry(entry: Entry) {
  const value = jsonObject(entry.value);
  const note = typeof value.note === "string" ? value.note : "";
  const parts = [entry.record_type.replaceAll("_", " ")];
  if (typeof value.minutes === "number") parts.push(`${value.minutes} minutes`);
  if (typeof value.amount === "number") parts.push(`${value.amount} ${typeof value.unit === "string" ? value.unit : ""}`.trim());
  if (typeof value.mealType === "string") parts.push(value.mealType);
  return { title: parts.join(" · "), note };
}

export default function WellnessCenter({
  patientId, lifeStage, canWrite, plans, entries, conditions, allergies,
}: {
  patientId: string;
  lifeStage: WellnessStage;
  canWrite: boolean;
  plans: Plan[];
  entries: Entry[];
  conditions: Constraint[];
  allergies: Constraint[];
}) {
  const [category, setCategory] = useState<WellnessCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(wellnessSuggestions[0]?.id ?? "");
  const [logType, setLogType] = useState<Entry["record_type"]>("habit");
  const [saveState, saveAction, saving] = useActionState(saveWellnessSuggestion, initialState);
  const [logState, logAction, logging] = useActionState(logWellnessEntry, initialState);
  const activePlans = plans.filter((plan) => plan.status === "active");
  const filtered = useMemo(() => wellnessSuggestions.filter((item) =>
    (category === "all" || item.category === category)
    && (lifeStage !== "infant" || !["balanced-meal", "meal-observation"].includes(item.id))
    && `${item.title} ${item.why(lifeStage)} ${item.limitation}`.toLowerCase().includes(query.trim().toLowerCase())), [category, lifeStage, query]);
  const selectedSuggestion = wellnessSuggestions.find((item) => item.id === selected && (lifeStage !== "infant" || !["balanced-meal", "meal-observation"].includes(item.id))) ?? filtered[0];
  const selectedCount = entries.length;

  return <section className="account-card wellness-center" aria-labelledby="wellness-center-title">
    <div className="account-card-heading"><div><span className="micro-label">MEDVITA REMEDIES &amp; WELLNESS</span><h2 id="wellness-center-title">Small steps, on your terms</h2><p>Explore general education, save personal goals, and keep a dated log. Nothing here diagnoses or treats a condition.</p></div><span className="account-card-icon"><Leaf size={18} /></span></div>

    {(conditions.length > 0 || allergies.length > 0) && <div className="account-safety-note"><ShieldCheck size={17} /><span>Recorded profile information may affect what is suitable. This center does not automatically assess restrictions or filter foods. Follow the care team&apos;s guidance and check ingredients against known allergies{allergies.length ? ` (${allergies.map((item) => item.name).join(", ")})` : ""}{conditions.length ? `; recorded condition notes: ${conditions.map((item) => item.name).join(", ")}` : ""}.</span></div>}
    {lifeStage === "infant" && <p className="timeline-privacy-note">For infant profiles, this center supports caregiver observation and logging only. Use the pediatric feeding records and follow individualized advice from the child&apos;s care team.</p>}

    <div className="wellness-week-summary" aria-label="Wellness activity summary"><div><strong>{activePlans.length}</strong><span>active goals</span></div><div><strong>{selectedCount}</strong><span>loaded logs</span></div><div><strong>{entries.filter((entry) => entry.record_type === "exercise").length}</strong><span>movement logs</span></div></div>
    <p className="timeline-privacy-note">Recent logs below are the entries loaded for this profile; counts are not a health score or a complete activity measure.</p>

    <div className="wellness-discovery">
      <div className="wellness-section-heading"><div><span className="micro-label">DISCOVER</span><h3>Browse by category</h3></div><Sparkles size={18} /></div>
      <div className="wellness-category-tabs" role="group" aria-label="Wellness categories">
        <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>All</button>
        {categoryOrder.map((item) => <button type="button" aria-pressed={category === item} key={item} onClick={() => setCategory(item)}>{wellnessCategoryLabels[item]}</button>)}
      </div>
      <label className="wellness-search"><Search size={16} /><span className="sr-only">Search wellness suggestions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement, meals, routines…" /></label>
      {filtered.length ? <div className="wellness-suggestion-grid">{filtered.map((item) => {
        const Icon = categoryIcons[item.category];
        const active = selectedSuggestion?.id === item.id;
        return <button type="button" className={`wellness-suggestion${active ? " selected" : ""}`} key={item.id} onClick={() => setSelected(item.id)} aria-pressed={active}>
          <span className="wellness-suggestion-icon"><Icon size={17} /></span><span><strong>{item.title}</strong><small>{wellnessCategoryLabels[item.category]} · {item.ageGroup(lifeStage)}</small></span><ChevronDown size={16} />
        </button>;
      })}</div> : <p className="care-log-empty">No suggestions match this search. Try a different word or category.</p>}
      {selectedSuggestion && <article className="wellness-suggestion-detail"><div className="wellness-detail-title"><div><span className="micro-label">{wellnessCategoryLabels[selectedSuggestion.category].toUpperCase()}</span><h4>{selectedSuggestion.title}</h4></div><CircleHelp size={18} /></div>
        <p><strong>Why it appears:</strong> {selectedSuggestion.why(lifeStage)}</p><p><strong>Intended group:</strong> {selectedSuggestion.ageGroup(lifeStage)}</p><p><strong>Limitations:</strong> {selectedSuggestion.limitation}</p>
        {selectedSuggestion.sourceUrl ? <p className="wellness-source">Source: <a href={selectedSuggestion.sourceUrl} target="_blank" rel="noreferrer">{selectedSuggestion.sourceLabel}</a></p> : <p className="wellness-source">{selectedSuggestion.sourceLabel}</p>}
        {canWrite && <form action={saveAction} className="wellness-inline-form"><input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="suggestionId" value={selectedSuggestion.id} /><button className="primary-button account-submit" type="submit" disabled={saving}><Target size={16} />{saving ? "Saving…" : "Save as a personal goal"}</button></form>}
      </article>}
      {saveState.message && <p className={`account-form-message ${saveState.status}`} role="status">{saveState.message}</p>}
    </div>

    <details className="wellness-log-disclosure"><summary><div><span className="micro-label">DAILY LOG</span><h3>Record an activity, meal, drink or habit</h3><p>Entries are dated personal observations. No targets are calculated.</p></div><span className="account-card-icon"><Check size={18} /></span></summary>
      {canWrite ? <form action={logAction} className="account-profile-form timeline-form"><input type="hidden" name="patientId" value={patientId} />
        <label htmlFor={`wellness-log-type-${patientId}`}>What would you like to log?</label><select id={`wellness-log-type-${patientId}`} name="recordType" value={logType} onChange={(event) => setLogType(event.target.value)}><option value="habit">Daily habit</option><option value="exercise">Movement or exercise</option><option value="meal" disabled={lifeStage === "infant"}>Meal or snack</option><option value="water">Drink or water observation</option></select>
        {activePlans.length > 0 && <><label htmlFor={`wellness-plan-${patientId}`}>Related goal <span>(optional)</span></label><select id={`wellness-plan-${patientId}`} name="planId" defaultValue=""><option value="">No goal selected</option>{activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></>}
        {logType === "meal" && <><label htmlFor={`wellness-meal-type-${patientId}`}>Meal or snack</label><select id={`wellness-meal-type-${patientId}`} name="mealType" defaultValue="snack"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></>}
        {logType === "exercise" && <><label htmlFor={`wellness-minutes-${patientId}`}>Duration in minutes <span>(optional)</span></label><input id={`wellness-minutes-${patientId}`} name="minutes" type="number" min="0" max="600" inputMode="numeric" /></>}
        {logType === "water" && <div className="wellness-amount-fields"><label htmlFor={`wellness-amount-${patientId}`}>Amount <span>(optional)</span></label><input id={`wellness-amount-${patientId}`} name="amount" type="number" min="0" max="5000" step="0.1" inputMode="decimal" /><label htmlFor={`wellness-amount-unit-${patientId}`}>Unit</label><select id={`wellness-amount-unit-${patientId}`} name="amountUnit" defaultValue="ml"><option value="ml">Millilitres</option><option value="cup">Cup</option><option value="glass">Glass</option></select><small>No daily fluid goal is set here; follow the person&apos;s own care plan.</small></div>}
        <label htmlFor={`wellness-log-note-${patientId}`}>Short note <span>(optional)</span></label><input id={`wellness-log-note-${patientId}`} name="note" maxLength={500} placeholder="Avoid sensitive health details" />
        {logState.message && <p className={`account-form-message ${logState.status}`} role="status">{logState.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={logging}><Check size={16} />{logging ? "Saving…" : "Save today's entry"}</button>
      </form> : <p className="timeline-privacy-note">You have read-only access to this profile. A person with active write access can add wellness logs.</p>}
    </details>

    <div className="wellness-saved-plans"><div className="wellness-section-heading"><div><span className="micro-label">PERSONAL GOALS</span><h3>Saved wellness goals</h3></div><Target size={18} /></div>
      {plans.length ? <div className="timeline-event-list">{plans.map((plan) => <article className="timeline-event" key={plan.id}><div className="timeline-event-heading"><span className="timeline-event-type">{wellnessCategoryLabels[plan.category as WellnessCategory] ?? plan.category} · {plan.status.replaceAll("_", " ")}</span><LocalDateTime value={plan.created_at} /></div><h4>{plan.title}</h4>{plan.description && <p>{plan.description.split(" Source:")[0]}</p>}{canWrite && plan.status !== "archived" && plan.status !== "complete" && <><WellnessPlanStatusForm patientId={patientId} plan={plan} /><WellnessCalendarForm patientId={patientId} plan={plan} /></>}</article>)}</div> : <p className="care-log-empty">No saved goals yet. Explore a suggestion above to add one.</p>}
    </div>

    <details className="wellness-recent-entries"><summary>Recent entries ({entries.length})</summary>{entries.length ? <div className="timeline-event-list">{entries.map((entry) => { const displayed = displayEntry(entry); return <article className="timeline-event" key={entry.id}><div className="timeline-event-heading"><span className="timeline-event-type">{displayed.title}</span><LocalDateTime value={entry.recorded_at} /></div>{displayed.note && <p>{displayed.note}</p>}</article>; })}</div> : <p className="care-log-empty">No recent wellness entries.</p>}</details>
    <p className="timeline-privacy-note">General education only. No home remedy is presented as a cure; no medication, supplement, restrictive diet, or clinical target is recommended. Seek qualified advice for individual restrictions.</p>
  </section>;
}

function WellnessPlanStatusForm({ patientId, plan }: { patientId: string; plan: Plan }) {
  const [state, action, pending] = useActionState(updateWellnessPlan, initialState);
  return <form action={action} className="wellness-plan-status"><input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="planId" value={plan.id} /><label htmlFor={`wellness-plan-status-${plan.id}`}>Goal status</label><select id={`wellness-plan-status-${plan.id}`} name="status" defaultValue={plan.status}><option value="active">Active</option><option value="paused">Paused</option><option value="complete">Complete</option><option value="archived">Archived</option></select><button type="submit" disabled={pending}>{pending ? "Saving…" : "Update"}</button>{state.message && <span role="status">{state.message}</span>}</form>;
}

function WellnessCalendarForm({ patientId, plan }: { patientId: string; plan: Plan }) {
  const [state, action, pending] = useActionState(createCalendarAppointment, initialCalendarState);
  return <details className="wellness-calendar-add"><summary>Add this goal to the personal calendar</summary><form action={action} className="wellness-plan-status"><input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="eventType" value="wellness_goal" /><input type="hidden" name="title" value={plan.title} /><label htmlFor={`wellness-calendar-${plan.id}`}>Date and time</label><input id={`wellness-calendar-${plan.id}`} name="startsAt" type="datetime-local" onChange={(event) => { const field = event.currentTarget.form?.elements.namedItem("startsAtOffset"); if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0"; }} required /><input type="hidden" name="startsAtOffset" defaultValue="0" /><input type="hidden" name="endsAtOffset" defaultValue="0" /><input type="hidden" name="endsAt" value="" /><input type="hidden" name="location" value="" /><input type="hidden" name="notes" value="" /><button type="submit" disabled={pending}>{pending ? "Adding…" : "Add to calendar"}</button>{state.message && <span role="status">{state.message}</span>}</form></details>;
}
