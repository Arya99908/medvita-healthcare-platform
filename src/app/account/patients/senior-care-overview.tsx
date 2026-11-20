"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore, type ChangeEvent } from "react";
import { Activity, CalendarDays, ClipboardList, HeartPulse, Pill, ShieldCheck, Siren, Users } from "lucide-react";
import { createSeniorCareObservation, setCaregiverAvailability, type CareLogFormState } from "./actions";
import VoiceDictation from "@/components/voice-dictation";

type Task = { id: string; title: string; status: string; due_at: string | null };
type Medication = { id: string; medicine_name: string; status: string };
type Schedule = { medication_id: string; frequency: string; administration_times: unknown; status: string };
type Symptom = { id: string; symptom: string; severity: number | null; observed_at: string };
type SeniorObservation = { id: string; observation_type: string; details: string; source: string; verification_status: string; observed_at: string };
type Appointment = { id: string; title: string; event_type: string; status: string; starts_at: string };
type EmergencyAlert = { id: string; alert_type: string; status: string; created_at: string };
type SharedAvailability = { user_id: string; display_name: string; relationship_role: string; availability_status: string; note: string | null; updated_at: string };

type Props = {
  patientId: string;
  conditions: Array<{ name: string; status: string }>;
  tasks: Task[];
  medications: Medication[];
  schedules: Schedule[];
  symptoms: Symptom[];
  observations: SeniorObservation[];
  appointments: Appointment[];
  caregiverCount: number;
  caregiverRoles: string[];
  availability: SharedAvailability[];
  ownAvailability: SharedAvailability | null;
  canSetAvailability: boolean;
  alerts: EmergencyAlert[];
  loadErrors: { conditions: boolean; tasks: boolean; medications: boolean; symptoms: boolean; seniorObservations: boolean; appointments: boolean; caregivers: boolean; alerts: boolean };
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function subscribeToLocalDay(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(interval);
}

function Section({ icon, title, error, children }: { icon: React.ReactNode; title: string; error: boolean; children: React.ReactNode }) {
  return <section className="senior-overview-card" aria-label={title}>
    <h3>{icon}{title}</h3>
    {error ? <p className="senior-overview-note">This information could not be loaded.</p> : children}
  </section>;
}

const initialAvailabilityState: CareLogFormState = { status: "idle", message: "" };
const initialObservationState: CareLogFormState = { status: "idle", message: "" };
const availabilityLabels: Record<string, string> = { available: "Available", limited: "Limited availability", unavailable: "Unavailable" };
const observationLabels: Record<string, string> = { mobility: "Mobility or walking", fall: "Fall", activity: "Activity or inactivity", appetite: "Appetite", hydration: "Hydration" };

export default function SeniorCareOverview({ patientId, conditions, tasks, medications, schedules, symptoms, observations, appointments, caregiverCount, caregiverRoles, availability, ownAvailability, canSetAvailability, canRecordObservations, alerts, loadErrors }: Props & { canRecordObservations: boolean }) {
  const today = useSyncExternalStore(subscribeToLocalDay, () => localDateKey(new Date()), () => "");
  const [availabilityState, availabilityAction, availabilityPending] = useActionState(setCaregiverAvailability, initialAvailabilityState);
  const [observationState, observationAction, observationPending] = useActionState(createSeniorCareObservation.bind(null, patientId), initialObservationState);

  function updateObservationTimezoneOffset(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.form?.elements.namedItem("observedAtOffset");
    if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
  }

  const currentConditions = conditions.filter((condition) => condition.status === "active");
  const currentMedicines = medications.filter((medication) => medication.status === "active");
  const todayTasks = today ? tasks.filter((task) => task.status !== "cancelled" && task.due_at && localDateKey(new Date(task.due_at)) === today) : [];
  const upcomingAppointments = today ? appointments.filter((appointment) => appointment.status === "scheduled" && localDateKey(new Date(appointment.starts_at)) >= today).slice(0, 4) : [];

  return <section className="account-card senior-overview" aria-labelledby="senior-overview-title">
    <div className="account-card-heading"><div><span className="micro-label">SENIOR CARE</span><h2 id="senior-overview-title">Care overview</h2><p>Saved profile information at a glance. Reports and schedules are not clinical assessments.</p></div><span className="account-card-icon"><HeartPulse size={18} /></span></div>
    <div className="senior-overview-grid">
      <Section icon={<HeartPulse size={16} />} title="Current health" error={loadErrors.conditions || loadErrors.medications}>
        <p>{currentConditions.length} condition {currentConditions.length === 1 ? "note" : "notes"} listed as current</p>
        {currentConditions.length > 0 && <p>{currentConditions.slice(0, 3).map((condition) => condition.name).join(", ")}</p>}
        <p>{currentMedicines.length} medicine {currentMedicines.length === 1 ? "note" : "notes"} listed as current</p>
        <p className="senior-overview-note">Entries are patient or caregiver reports.</p>
      </Section>

      <Section icon={<ClipboardList size={16} />} title="Today's care tasks" error={loadErrors.tasks}>
        {!today ? <p className="senior-overview-note">Loading today&apos;s local summary…</p> : todayTasks.length ? <ul>{todayTasks.slice(0, 4).map((task) => <li key={task.id}><strong>{task.title}</strong><span>{task.status.replaceAll("_", " ")}</span></li>)}</ul> : <p>No tasks are due today.</p>}
        <Link href="/account/care">Open care tasks</Link>
      </Section>

      <Section icon={<Pill size={16} />} title="Medication schedule" error={loadErrors.medications}>
        {currentMedicines.length ? <ul>{currentMedicines.slice(0, 4).map((medication) => {
          const activeSchedules = schedules.filter((schedule) => schedule.medication_id === medication.id && schedule.status === "active");
          const times = activeSchedules.flatMap((schedule) => Array.isArray(schedule.administration_times) ? schedule.administration_times.filter((time): time is string => typeof time === "string") : []);
          return <li key={medication.id}><strong>{medication.medicine_name}</strong><span>{times.length ? [...new Set(times)].sort().join(", ") : activeSchedules[0]?.frequency ?? "No active schedule saved"}</span></li>;
        })}</ul> : <p>No medicine notes are listed as current.</p>}
        <p className="senior-overview-note">Confirm directions with the patient or clinician.</p>
      </Section>

      <Section icon={<Activity size={16} />} title="Recent symptoms" error={loadErrors.symptoms}>
        {symptoms.length ? <ul>{symptoms.slice(0, 4).map((symptom) => <li key={symptom.id}><strong>{symptom.symptom}</strong><span>Reported {localDateTime(symptom.observed_at)}{symptom.severity === null ? " · severity not recorded" : ` · severity ${symptom.severity}/5`}</span></li>)}</ul> : <p>No symptoms have been recorded.</p>}
      </Section>

      <Section icon={<Activity size={16} />} title="Daily wellbeing observations" error={loadErrors.seniorObservations}>
        {observations.length ? <ul>{observations.slice(0, 5).map((item) => <li key={item.id}><strong>{observationLabels[item.observation_type] ?? "Care observation"}</strong><span>{item.details}</span><span>{item.source === "patient" ? "Patient report" : "Caregiver report"} · {item.verification_status} · {localDateTime(item.observed_at)}</span></li>)}</ul> : <p>No mobility, fall, activity, appetite, or hydration observations are recorded.</p>}
        {observations.length > 5 && <details className="senior-observations-history"><summary>See {observations.length - 5} earlier observations</summary><ul>{observations.slice(5).map((item) => <li key={item.id}><strong>{observationLabels[item.observation_type] ?? "Care observation"}</strong><span>{item.details}</span><span>{item.source === "patient" ? "Patient report" : "Caregiver report"} · {item.verification_status} · {localDateTime(item.observed_at)}</span></li>)}</ul></details>}
        <p className="senior-overview-note">These notes are unverified reports. They do not assess fall risk, nutrition, hydration, or urgency.</p>
        {canRecordObservations && <details className="senior-availability-form-disclosure"><summary>Add a daily observation</summary><form action={observationAction} className="senior-availability-form">
          <label htmlFor="senior-observation-type">Observation type</label><select id="senior-observation-type" name="observationType" defaultValue="mobility"><option value="mobility">Mobility or walking</option><option value="fall">Fall</option><option value="activity">Activity or inactivity</option><option value="appetite">Appetite</option><option value="hydration">Hydration</option></select>
          <label htmlFor="senior-observation-details">What was noticed?</label><textarea id="senior-observation-details" name="details" minLength={3} maxLength={1000} rows={3} required placeholder="Describe what the patient or care partner observed" /><VoiceDictation targetId="senior-observation-details" />
          <label htmlFor="senior-observation-time">Observed date and time <span>(optional; defaults to now)</span></label><input id="senior-observation-time" name="observedAt" type="datetime-local" onChange={updateObservationTimezoneOffset} /><input type="hidden" name="observedAtOffset" defaultValue="0" />
          {observationState.message && <p className={`account-form-message ${observationState.status}`} role="status">{observationState.message}</p>}
          <button className="secondary-button" type="submit" disabled={observationPending}>{observationPending ? "Saving…" : "Save observation"}</button>
        </form></details>}
      </Section>

      <Section icon={<CalendarDays size={16} />} title="Upcoming appointments" error={loadErrors.appointments}>
        {!today ? <p className="senior-overview-note">Loading today&apos;s local summary…</p> : upcomingAppointments.length ? <ul>{upcomingAppointments.map((appointment) => <li key={appointment.id}><strong>{appointment.title}</strong><span>{localDateTime(appointment.starts_at)} · {appointment.event_type.replaceAll("_", " ")}</span></li>)}</ul> : <p>No upcoming appointments are saved.</p>}
        <Link href="/account/calendar">Open calendar</Link>
      </Section>

      <Section icon={<Users size={16} />} title="Care team" error={loadErrors.caregivers}>
        {caregiverCount ? <><p>{caregiverCount} linked care {caregiverCount === 1 ? "partner" : "partners"}</p><p>{[...new Set(caregiverRoles)].map((role) => role.replaceAll("_", " ")).join(", ")}</p></> : <p>No linked caregiver or family access is recorded.</p>}
        {availability.length ? <ul>{availability.map((item) => <li key={item.user_id}><strong>{item.display_name} · {item.relationship_role.replaceAll("_", " ")}</strong><span>{availabilityLabels[item.availability_status] ?? "Availability status"} · updated {localDateTime(item.updated_at)}</span>{item.note && <span>{item.note}</span>}</li>)}</ul> : <p>No care partners have shared an availability status.</p>}
        <p className="senior-overview-note">Availability is self-reported and may change. Confirm directly; it is not emergency dispatch.</p>
        {canSetAvailability && <details className="senior-availability-form-disclosure"><summary>{ownAvailability ? "Update your availability" : "Share your availability"}</summary><form action={availabilityAction} className="senior-availability-form">
          <input type="hidden" name="patientId" value={patientId} />
          <label htmlFor="senior-availability-display-name">Name to share with the care team</label><input id="senior-availability-display-name" name="displayName" defaultValue={ownAvailability?.display_name ?? ""} required minLength={2} maxLength={80} />
          <label htmlFor="senior-availability-status">Availability</label><select id="senior-availability-status" name="availabilityStatus" defaultValue={ownAvailability?.availability_status ?? "available"}><option value="available">Available</option><option value="limited">Limited availability</option><option value="unavailable">Unavailable</option></select>
          <label htmlFor="senior-availability-note">Short note <span>(optional)</span></label><input id="senior-availability-note" name="note" defaultValue={ownAvailability?.note ?? ""} maxLength={160} placeholder="For example, mornings only" />
          {availabilityState.message && <p className={`account-form-message ${availabilityState.status}`} role="status">{availabilityState.message}</p>}
          <button className="secondary-button" type="submit" disabled={availabilityPending}>{availabilityPending ? "Saving…" : "Share availability"}</button>
        </form></details>}
      </Section>

      <Section icon={<ShieldCheck size={16} />} title="Recent emergency log" error={loadErrors.alerts}>
        {alerts.length ? <ul>{alerts.slice(0, 3).map((alert) => <li key={alert.id}><strong>{alert.alert_type.replaceAll("_", " ")}</strong><span>{localDateTime(alert.created_at)} · recorded only</span></li>)}</ul> : <p>No emergency actions are recorded.</p>}
        <Link href={`/account/patients/${patientId}#patient-emergency-title`}><Siren size={14} /> Emergency access</Link>
      </Section>
    </div>
  </section>;
}
