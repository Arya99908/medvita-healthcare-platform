import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, ArrowLeft, BarChart3, CalendarDays, Heart, Pill, ShieldCheck } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { createClient } from "@/lib/supabase/server";
import PrintReportButton from "./report-controls";
import { countBy, countByDate, inDateRange, type DatedValue } from "./report-utils";

const rangeOptions = [7, 30, 90, 365] as const;

function TrendCard({ title, note, points }: { title: string; note: string; points: DatedValue[] }) {
  const visible = points.slice(-60);
  const values = visible.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || 1;
  const chartPoints = visible.map((point, index) => ({
    ...point,
    x: visible.length === 1 ? 300 : 24 + index * (552 / (visible.length - 1)),
    y: 150 - ((point.value - low) / span) * 120,
  }));
  const line = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return <section className="report-card" aria-label={title}>
    <div className="report-card-heading"><h3>{title}</h3><span>{visible.length} readings</span></div>
    {visible.length ? <>
      <svg className="report-chart" viewBox="0 0 600 180" role="img" aria-label={`${title}: ${visible.length} recorded values across the selected date range`}>
        <line x1="24" y1="150" x2="576" y2="150" className="report-chart-axis" />
        {visible.length > 1 && <polyline points={line} className="report-chart-line" />}
        {chartPoints.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="4" className="report-chart-point"><title>{point.date}: {point.value} {point.unit}</title></circle>)}
      </svg>
      <details className="report-data-table"><summary>Show all recorded values</summary><div className="report-table-scroll"><table><thead><tr><th>Date</th><th>Value</th><th>Source</th></tr></thead><tbody>{visible.slice().reverse().map((point, index) => <tr key={`${point.date}-${index}`}><td>{point.date}</td><td>{point.value} {point.unit}</td><td>{point.source}</td></tr>)}</tbody></table></div></details>
    </> : <p className="report-empty">No readings in this date range.</p>}
    <p className="report-source">{note}</p>
  </section>;
}

export default async function PatientReportsPage({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ days?: string }> }) {
  const [{ patientId }, { days: requestedDays }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patientId)) notFound();
  const days = rangeOptions.find((value) => String(value) === requestedDays) ?? 30;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,display_name,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile) notFound();
  const canRead = relationship?.status === "active" && relationship.can_read;
  if (!canRead) return <main className="account-page"><header className="account-topbar"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Profiles</Link></header><div className="care-dashboard-content"><div className="account-empty-state"><ShieldCheck size={24} /><strong>Reports are not available</strong><span>Active read access is required to view this profile’s reports.</span></div></div></main>;

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const from = start.toISOString();
  const before = end.toISOString();
  const fromDate = from.slice(0, 10);
  const beforeDate = before.slice(0, 10);
  const through = new Date(end);
  through.setUTCDate(through.getUTCDate() - 1);
  const throughDate = through.toISOString().slice(0, 10);
  const isChild = profile.life_stage === "infant" || profile.life_stage === "child";
  const isAdolescent = profile.life_stage === "adolescent";

  const [vitalsResult, growthResult, symptomsResult, medicationResult, sleepResult, feedingResult, wellnessResult, activityResult, healthResult, menstrualResult, appointmentsResult] = await Promise.all([
    supabase.from("vitals").select("id,vital_type,value,unit,source,verification_status,measured_at").eq("patient_id", patientId).gte("measured_at", from).lt("measured_at", before).order("measured_at", { ascending: true }).limit(500),
    isChild ? supabase.from("growth_records").select("id,weight_kg,height_cm,head_circumference_cm,source,measured_at").eq("patient_id", patientId).gte("measured_at", from).lt("measured_at", before).order("measured_at", { ascending: true }).limit(500) : Promise.resolve({ data: [], error: null }),
    supabase.from("symptom_observations").select("id,symptom,severity,observed_at").eq("patient_id", patientId).gte("observed_at", from).lt("observed_at", before).order("observed_at", { ascending: false }).limit(500),
    supabase.from("medication_administration_logs").select("id,status,administered_at,recorded_by").eq("patient_id", patientId).gte("administered_at", from).lt("administered_at", before).order("administered_at", { ascending: false }).limit(500),
    supabase.from("sleep_records").select("id,sleep_type,started_at,ended_at,source,verification_status").eq("patient_id", patientId).gte("started_at", from).lt("started_at", before).order("started_at", { ascending: true }).limit(500),
    supabase.from("feeding_records").select("id,feeding_type,quantity_ml,duration_minutes,recorded_at,created_by").eq("patient_id", patientId).gte("recorded_at", from).lt("recorded_at", before).order("recorded_at", { ascending: true }).limit(500),
    supabase.from("wellness_records").select("id,record_type,recorded_at").eq("patient_id", patientId).gte("recorded_at", from).lt("recorded_at", before).order("recorded_at", { ascending: false }).limit(500),
    supabase.from("patient_activity_events").select("id,actor_user_id,action,resource_type,occurred_at").eq("patient_id", patientId).gte("occurred_at", from).lt("occurred_at", before).order("occurred_at", { ascending: false }).limit(500),
    supabase.from("health_events").select("id,event_type,title,source,verification_status,occurred_at,visibility").eq("patient_id", patientId).gte("occurred_at", from).lt("occurred_at", before).order("occurred_at", { ascending: false }).limit(500),
    isAdolescent ? supabase.from("menstrual_records").select("id,period_start,period_end,visibility").eq("patient_id", patientId).gte("period_start", fromDate).lt("period_start", beforeDate).order("period_start", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    supabase.from("appointments").select("id,title,event_type,status,starts_at,source,visibility").eq("patient_id", patientId).gte("starts_at", from).lt("starts_at", before).order("starts_at", { ascending: false }).limit(500),
  ]);
  const errors = [vitalsResult.error, growthResult.error, symptomsResult.error, medicationResult.error, sleepResult.error, feedingResult.error, wellnessResult.error, activityResult.error, healthResult.error, menstrualResult.error, appointmentsResult.error];
  const rowCapReached = [
    vitalsResult.data, growthResult.data, symptomsResult.data, medicationResult.data, sleepResult.data,
    feedingResult.data, wellnessResult.data, activityResult.data, healthResult.data, menstrualResult.data, appointmentsResult.data,
  ].some((rows) => (rows?.length ?? 0) >= 500);
  const partial = errors.some(Boolean) || rowCapReached;
  const vitals = vitalsResult.data ?? [];
  const growth = growthResult.data ?? [];
  const symptoms = symptomsResult.data ?? [];
  const medicationLogs = medicationResult.data ?? [];
  const sleepRecords = sleepResult.data ?? [];
  const feedingRecords = feedingResult.data ?? [];
  const wellnessRecords = wellnessResult.data ?? [];
  const activityEvents = activityResult.data ?? [];
  const healthEvents = healthResult.data ?? [];
  const menstrualRecords = menstrualResult.data ?? [];
  const appointments = appointmentsResult.data ?? [];
  const pointsForVital = (type: string): DatedValue[] => vitals.filter((record) => record.vital_type === type).map((record) => ({ date: record.measured_at, value: Number(record.value), unit: record.unit, source: `${record.source.replaceAll("_", " ")} · ${record.verification_status}` }));
  const weightPoints: DatedValue[] = [
    ...pointsForVital("weight"),
    ...growth.filter((record) => record.weight_kg != null).map((record) => ({ date: record.measured_at, value: Number(record.weight_kg), unit: "kg", source: `${record.source.replaceAll("_", " ")} · unverified` })),
  ].sort((first, second) => first.date.localeCompare(second.date));
  const feedingCounts = countByDate(feedingRecords, (record) => record.recorded_at);
  const sleepHours = sleepRecords.map((record) => ({ date: record.started_at, value: Math.max(0, (Date.parse(record.ended_at) - Date.parse(record.started_at)) / 3_600_000), unit: "hours", source: `${record.source.replaceAll("_", " ")} · ${record.verification_status}` }));
  const symptomCounts = countBy(symptoms, (record) => record.symptom).slice(0, 10);
  const statusCounts = countBy(medicationLogs, (record) => record.status);
  const taken = medicationLogs.filter((record) => record.status === "taken").length;
  const missed = medicationLogs.filter((record) => record.status === "missed").length;
  const accountable = taken + missed;
  const boundedActivity = activityEvents.filter((event) => inDateRange(event.occurred_at, fromDate, beforeDate));
  const activityCounts = countBy(boundedActivity, (event) => event.action.replaceAll("_", " "));
  const wellnessCounts = countBy(wellnessRecords, (record) => record.record_type.replaceAll("_", " "));

  return <main className="account-page report-page">
    <header className="account-topbar report-screen-only"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href={`/account/patients/${patientId}`} className="account-back-link"><ArrowLeft size={15} /> Patient timeline</Link><Link href="/account" className="account-back-link">Profiles</Link></div></header>
    <div className="care-dashboard-content">
      <div className="report-toolbar"><div className="account-welcome"><span className="micro-label">PATIENT REPORT</span><h1>{profile.display_name}</h1><p>{profile.life_stage.replaceAll("_", " ")} · {fromDate} through {throughDate} · generated {new Date().toLocaleString()}</p></div><PrintReportButton /></div>
      <nav className="report-range-nav report-screen-only" aria-label="Report date range">{rangeOptions.map((option) => <Link key={option} href={`/account/patients/${patientId}/reports?days=${option}`} aria-current={days === option ? "page" : undefined} className={days === option ? "active" : ""}>{option === 7 ? "7 days" : option === 30 ? "30 days" : option === 90 ? "90 days" : "12 months"}</Link>)}</nav>
      <section className="report-disclosure"><ShieldCheck size={17} /><p>This is a summary of records available to your account, not a complete medical history or clinical interpretation. Entries remain as reported and may be unverified. Date range: {fromDate} to {throughDate}.</p></section>
      <p className="report-source-overview">Sources: access-controlled MedVita profile records for measurements, symptoms, medication administration, appointments, health events, child care logs, wellness entries, and caregiver activity where available.</p>
      {partial && <div className="account-form-message error" role="status">{rowCapReached ? "At least one record list reached the report limit." : "Some data sources could not be loaded."} This report may be incomplete; check the profile timeline before sharing it.</div>}
      <section className="report-summary-grid" aria-label="Summary counts">
        <SummaryCard icon={<Activity size={18} />} title="Measurements" count={vitals.length + growth.length} />
        <SummaryCard icon={<Heart size={18} />} title="Symptom notes" count={symptoms.length} />
        <SummaryCard icon={<Pill size={18} />} title="Medicine events" count={medicationLogs.length} />
        <SummaryCard icon={<CalendarDays size={18} />} title="Appointments" count={appointments.length} />
      </section>
      <section className="report-section" aria-labelledby="measurements-title"><div className="report-section-heading"><BarChart3 size={20} /><div><h2 id="measurements-title">Recorded measurements</h2><p>Source and verification labels are retained from each entry. No target ranges or trends are clinically interpreted.</p></div></div><div className="report-chart-grid">
        <TrendCard title="Weight" note="Source: patient or care-team record · units are shown per entry." points={weightPoints} />
        <TrendCard title="Blood pressure · systolic" note="Source: self-reported or connected record · not interpreted." points={pointsForVital("blood_pressure_systolic")} />
        <TrendCard title="Blood pressure · diastolic" note="Source: self-reported or connected record · not interpreted." points={pointsForVital("blood_pressure_diastolic")} />
        <TrendCard title="Blood glucose" note="Source: self-reported or connected record · not interpreted." points={pointsForVital("blood_glucose")} />
        {isChild && <TrendCard title="Growth record · height" note="Caregiver or patient-entered measurements; no age norms or percentiles are calculated." points={growth.filter((record) => record.height_cm != null).map((record) => ({ date: record.measured_at, value: Number(record.height_cm), unit: "cm", source: `${record.source.replaceAll("_", " ")} · unverified` }))} />}
        {isChild && <TrendCard title="Growth record · head circumference" note="Caregiver or patient-entered measurements; no age norms or percentiles are calculated." points={growth.filter((record) => record.head_circumference_cm != null).map((record) => ({ date: record.measured_at, value: Number(record.head_circumference_cm), unit: "cm", source: `${record.source.replaceAll("_", " ")} · unverified` }))} />}
      </div></section>
      <div className="report-two-column">
        <ReportCountTable title="Symptom frequency" description="Counts of symptom labels recorded in the selected period. One entry may contain a self-reported severity." rows={symptomCounts.map((item) => ({ label: item.label, value: `${item.count} ${item.count === 1 ? "entry" : "entries"}` }))} empty="No symptom entries in this period." />
        <ReportCountTable title="Medication administration events" description={accountable ? `${taken} recorded as taken and ${missed} recorded as missed (${Math.round(taken / accountable * 100)}% of those two statuses). Skipped and uncertain entries are listed separately and excluded from this ratio.` : "No taken or missed events are available to calculate a ratio."} rows={statusCounts.map((item) => ({ label: item.label, value: String(item.count) }))} empty="No medicine events in this period." />
        <TrendCard title="Sleep duration" note="Duration is calculated from the entered start and end times; the records may be incomplete." points={sleepHours} />
        <TrendCard title="Feeding records per day" note="Counts logged feeding entries; it does not indicate nutrition adequacy." points={feedingCounts.map((point) => ({ ...point, unit: "entries", source: "feeding log" }))} />
        <ReportCountTable title="Wellness log entries" description="Counts by the record type saved in the profile. Values are not interpreted." rows={wellnessCounts.map((item) => ({ label: item.label, value: String(item.count) }))} empty="No wellness entries in this period." />
        <ReportCountTable title="Caregiver activity" description="Activity labels come from the profile audit feed. The feed begins when it was enabled; it is not a historical record." rows={activityCounts.map((item) => ({ label: item.label, value: String(item.count) }))} empty="No activity feed entries in this period." />
      </div>
      {isAdolescent && <section className="report-card report-sensitive" aria-labelledby="cycle-report-title"><h3 id="cycle-report-title">Sensitive cycle history</h3><p>Visible only when your account has consent to these records. This report shows dates only and does not infer cycle regularity.</p>{menstrualResult.error ? <p className="report-empty">Cycle history could not be loaded.</p> : menstrualRecords.length ? <ul>{menstrualRecords.map((record) => <li key={record.id}>{record.period_start ?? "Start date not recorded"}{record.period_end ? ` to ${record.period_end}` : " · end date not recorded"}</li>)}</ul> : <p className="report-empty">No cycle records in this period or they are not visible to your account.</p>}</section>}
      <section className="report-card" aria-labelledby="health-events-title"><h3 id="health-events-title">Health event summary</h3><p>Entries visible to your account in the selected period. Each record retains its original source and verification label.</p>{healthResult.error ? <p className="report-empty">Health events could not be loaded.</p> : healthEvents.length ? <div className="report-data-table"><div className="report-table-scroll"><table><thead><tr><th>Date</th><th>Event</th><th>Type</th><th>Source</th><th>Verification</th></tr></thead><tbody>{healthEvents.map((event) => <tr key={event.id}><td><LocalDateTime value={event.occurred_at} /></td><td>{event.title}</td><td>{event.event_type.replaceAll("_", " ")}</td><td>{event.source.replaceAll("_", " ")}</td><td>{event.verification_status}</td></tr>)}</tbody></table></div></div> : <p className="report-empty">No health events in this period.</p>}</section>
      <section className="report-card" aria-labelledby="appointment-summary-title"><h3 id="appointment-summary-title">Appointments in date range</h3>{appointmentsResult.error ? <p className="report-empty">Appointments could not be loaded.</p> : appointments.length ? <ul className="report-appointment-list">{appointments.map((appointment) => <li key={appointment.id}><LocalDateTime value={appointment.starts_at} /> · {appointment.title} · {appointment.status.replaceAll("_", " ")} · {appointment.source.replaceAll("_", " ")}</li>)}</ul> : <p className="report-empty">No appointments in this period.</p>}</section>
      <footer className="report-footer">MedVita · {profile.display_name} · {fromDate} to {throughDate} · User-entered records may be incomplete or unverified.</footer>
    </div>
  </main>;
}

function SummaryCard({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return <div className="report-summary-card"><span>{icon}</span><div><strong>{count}</strong><small>{title}</small></div></div>;
}

function ReportCountTable({ title, description, rows, empty }: { title: string; description: string; rows: { label: string; value: string }[]; empty: string }) {
  return <section className="report-card"><h3>{title}</h3><p>{description}</p>{rows.length ? <div className="report-count-list">{rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div> : <p className="report-empty">{empty}</p>}</section>;
}
