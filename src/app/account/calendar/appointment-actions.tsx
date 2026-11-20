"use client";

import { useActionState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { deleteAppointment, updateAppointment, type AppointmentFormState } from "../patients/actions";

type Appointment = { id: string; event_type: string; title: string; starts_at: string; ends_at: string | null; location: string | null; notes: string | null };
const initialState: AppointmentFormState = { status: "idle", message: "" };

function localDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function setOffset(form: HTMLFormElement | null, field: string, value: string) {
  const target = form?.elements.namedItem(field);
  if (target instanceof HTMLInputElement) target.value = value ? String(new Date(value).getTimezoneOffset()) : "0";
}

export function AppointmentEditForm({ patientId, appointment }: { patientId: string; appointment: Appointment }) {
  const actionForAppointment = updateAppointment.bind(null, patientId, appointment.id);
  const [state, action, pending] = useActionState(actionForAppointment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const starts = form.elements.namedItem("startsAt");
    const ends = form.elements.namedItem("endsAt");
    if (starts instanceof HTMLInputElement) { starts.value = localDateTime(appointment.starts_at); setOffset(form, "startsAtOffset", starts.value); }
    if (ends instanceof HTMLInputElement && appointment.ends_at) { ends.value = localDateTime(appointment.ends_at); setOffset(form, "endsAtOffset", ends.value); }
  }, [appointment.starts_at, appointment.ends_at]);
  const timezoneChange = (event: ChangeEvent<HTMLInputElement>, name: string) => setOffset(event.currentTarget.form, name, event.currentTarget.value);

  return <details className="calendar-event-edit">
    <summary className="account-record-link"><Pencil size={13} /> Edit event</summary>
    <form ref={formRef} action={action} className="calendar-event-edit-form">
      <label>Event type<select name="eventType" defaultValue={appointment.event_type}><option value="doctor_appointment">Doctor appointment</option><option value="hospital_visit">Hospital visit</option><option value="hospital_admission">Hospital admission</option><option value="discharge_date">Discharge date</option><option value="laboratory_test">Laboratory test</option><option value="imaging">Imaging</option><option value="vaccination">Vaccination</option><option value="follow_up">Follow-up</option><option value="medication_refill">Medication refill</option><option value="exercise">Exercise</option><option value="meal">Meal</option><option value="wellness_goal">Wellness goal</option><option value="caregiver_visit">Caregiver visit</option><option value="home_nursing">Home nursing</option><option value="procedure">Procedure</option><option value="therapy">Therapy</option><option value="general">General health event</option></select></label>
      <label>Title<input name="title" minLength={2} maxLength={120} defaultValue={appointment.title} required /></label>
      <label>Starts<input name="startsAt" type="datetime-local" onChange={(event) => timezoneChange(event, "startsAtOffset")} required /></label><input type="hidden" name="startsAtOffset" defaultValue="0" />
      <label>Ends (optional)<input name="endsAt" type="datetime-local" onChange={(event) => timezoneChange(event, "endsAtOffset")} /></label><input type="hidden" name="endsAtOffset" defaultValue="0" />
      <label>Location<input name="location" maxLength={200} defaultValue={appointment.location ?? ""} /></label>
      <label>Notes<textarea name="notes" rows={2} maxLength={1000} defaultValue={appointment.notes ?? ""} /></label>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
      <button className="account-record-link" type="submit" disabled={pending}><Save size={13} /> {pending ? "Saving…" : "Save changes"}</button>
    </form>
  </details>;
}

export function AppointmentDeleteForm({ patientId, appointmentId }: { patientId: string; appointmentId: string }) {
  const actionForAppointment = deleteAppointment.bind(null, patientId, appointmentId);
  const [state, action, pending] = useActionState(actionForAppointment, initialState);
  const confirmDelete = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Remove this calendar event from the profile?")) event.preventDefault();
  };
  return <form action={action} className="calendar-event-delete-form" onSubmit={confirmDelete}>
    <button className="account-record-link" type="submit" disabled={pending}><Trash2 size={13} /> {pending ? "Removing…" : "Remove event"}</button>
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
  </form>;
}
