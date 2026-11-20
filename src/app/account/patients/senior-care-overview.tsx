"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Activity, CalendarDays, ClipboardList, HeartPulse, Pill, ShieldCheck, Siren, Users } from "lucide-react";

type Task = { id: string; title: string; status: string; due_at: string | null };
type Medication = { id: string; medicine_name: string; status: string };
type Schedule = { medication_id: string; frequency: string; administration_times: unknown; status: string };
type Symptom = { id: string; symptom: string; severity: number | null; observed_at: string };
type Appointment = { id: string; title: string; event_type: string; status: string; starts_at: string };
type EmergencyAlert = { id: string; alert_type: string; status: string; created_at: string };

type Props = {
  patientId: string;
  conditions: Array<{ name: string; status: string }>;
  tasks: Task[];
  medications: Medication[];
  schedules: Schedule[];
  symptoms: Symptom[];
  appointments: Appointment[];
  caregiverCount: number;
  caregiverRoles: string[];
  alerts: EmergencyAlert[];
  loadErrors: { conditions: boolean; tasks: boolean; medications: boolean; symptoms: boolean; appointments: boolean; caregivers: boolean; alerts: boolean };
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

export default function SeniorCareOverview({ patientId, conditions, tasks, medications, schedules, symptoms, appointments, caregiverCount, caregiverRoles, alerts, loadErrors }: Props) {
  const today = useSyncExternalStore(subscribeToLocalDay, () => localDateKey(new Date()), () => "");

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

      <Section icon={<CalendarDays size={16} />} title="Upcoming appointments" error={loadErrors.appointments}>
        {!today ? <p className="senior-overview-note">Loading today&apos;s local summary…</p> : upcomingAppointments.length ? <ul>{upcomingAppointments.map((appointment) => <li key={appointment.id}><strong>{appointment.title}</strong><span>{localDateTime(appointment.starts_at)} · {appointment.event_type.replaceAll("_", " ")}</span></li>)}</ul> : <p>No upcoming appointments are saved.</p>}
        <Link href="/account/calendar">Open calendar</Link>
      </Section>

      <Section icon={<Users size={16} />} title="Care team" error={loadErrors.caregivers}>
        {caregiverCount ? <><p>{caregiverCount} linked care {caregiverCount === 1 ? "partner" : "partners"}</p><p>{[...new Set(caregiverRoles)].map((role) => role.replaceAll("_", " ")).join(", ")}</p></> : <p>No linked caregiver or family access is recorded.</p>}
        <p className="senior-overview-note">Availability is not currently collected in this profile.</p>
      </Section>

      <Section icon={<ShieldCheck size={16} />} title="Recent emergency log" error={loadErrors.alerts}>
        {alerts.length ? <ul>{alerts.slice(0, 3).map((alert) => <li key={alert.id}><strong>{alert.alert_type.replaceAll("_", " ")}</strong><span>{localDateTime(alert.created_at)} · recorded only</span></li>)}</ul> : <p>No emergency actions are recorded.</p>}
        <Link href={`/account/patients/${patientId}#patient-emergency-title`}><Siren size={14} /> Emergency access</Link>
      </Section>
    </div>
  </section>;
}
