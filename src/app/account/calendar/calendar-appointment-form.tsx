"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { createCalendarAppointment, type AppointmentFormState } from "../patients/actions";

const initialState: AppointmentFormState = { status: "idle", message: "" };
type PatientOption = { id: string; display_name: string; life_stage: string };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>, fieldName: string) {
  const field = event.currentTarget.form?.elements.namedItem(fieldName);
  if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
}

export default function CalendarAppointmentForm({ patients }: { patients: PatientOption[] }) {
  const [state, action, pending] = useActionState(createCalendarAppointment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  if (patients.length === 0) return <section className="account-card"><h2>Add a calendar event</h2><p>Active write access to a patient profile is needed before adding events.</p></section>;
  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">MEDICAL CALENDAR</span><h2>Add an event</h2><p>Events are saved to the selected profile. No reminder or external booking is sent.</p></div><span className="account-card-icon"><CalendarPlus size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="calendar-patient">Patient profile</label><select id="calendar-patient" name="patientId" required>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.display_name} · {patient.life_stage}</option>)}</select>
      <label htmlFor="calendar-event-type">Event type</label><select id="calendar-event-type" name="eventType" defaultValue="doctor_appointment"><option value="doctor_appointment">Doctor appointment</option><option value="hospital_visit">Hospital visit</option><option value="hospital_admission">Hospital admission</option><option value="discharge_date">Discharge date</option><option value="laboratory_test">Laboratory test</option><option value="imaging">Imaging</option><option value="vaccination">Vaccination</option><option value="follow_up">Follow-up</option><option value="medication_refill">Medication refill</option><option value="exercise">Exercise</option><option value="meal">Meal</option><option value="wellness_goal">Wellness goal</option><option value="caregiver_visit">Caregiver visit</option><option value="home_nursing">Home nursing</option><option value="procedure">Procedure</option><option value="therapy">Therapy</option><option value="general">General health event</option></select>
      <label htmlFor="calendar-event-title">Event</label><input id="calendar-event-title" name="title" minLength={2} maxLength={120} required placeholder="Give the event a short name" />
      <label htmlFor="calendar-event-start">Date and time</label><input id="calendar-event-start" name="startsAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "startsAtOffset")} required /><input type="hidden" name="startsAtOffset" defaultValue="0" />
      <label htmlFor="calendar-event-end">End time <span>(optional)</span></label><input id="calendar-event-end" name="endsAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "endsAtOffset")} /><input type="hidden" name="endsAtOffset" defaultValue="0" />
      <label htmlFor="calendar-event-location">Location <span>(optional)</span></label><input id="calendar-event-location" name="location" maxLength={200} />
      <label htmlFor="calendar-event-notes">Notes <span>(optional)</span></label><textarea id="calendar-event-notes" name="notes" rows={3} maxLength={1000} />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><CalendarPlus size={16} />{pending ? "Saving…" : "Save calendar event"}</button>
    </form>
  </details>;
}
