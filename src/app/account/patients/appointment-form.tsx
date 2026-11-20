"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { CalendarDays, Check, Plus } from "lucide-react";
import { createAppointment, type AppointmentFormState } from "./actions";

const initialState: AppointmentFormState = { status: "idle", message: "" };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>, fieldName: string) {
  const field = event.currentTarget.form?.elements.namedItem(fieldName);
  if (field instanceof HTMLInputElement) {
    field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
  }
}

export default function AppointmentForm({ patientId }: { patientId: string }) {
  const actionForPatient = createAppointment.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return <details className="account-card account-entry-disclosure" aria-labelledby="appointment-form-title">
    <summary className="account-card-heading"><div><span className="micro-label">CARE CALENDAR</span><h2 id="appointment-form-title">Add an appointment</h2><p>This records a plan; it does not book with a clinic or send a reminder.</p></div><span className="account-card-icon"><CalendarDays size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="appointment-type">Event type</label><select id="appointment-type" name="eventType" defaultValue="doctor_appointment"><option value="doctor_appointment">Doctor appointment</option><option value="hospital_visit">Hospital visit</option><option value="hospital_admission">Hospital admission</option><option value="discharge_date">Discharge date</option><option value="laboratory_test">Laboratory test</option><option value="imaging">Imaging</option><option value="vaccination">Vaccination</option><option value="follow_up">Follow-up</option><option value="medication_refill">Medication refill</option><option value="exercise">Exercise</option><option value="meal">Meal</option><option value="wellness_goal">Wellness goal</option><option value="caregiver_visit">Caregiver visit</option><option value="home_nursing">Home nursing</option><option value="procedure">Procedure</option><option value="therapy">Therapy</option><option value="general">General health event</option></select>
      <label htmlFor="appointment-title">Appointment</label>
      <input id="appointment-title" name="title" minLength={2} maxLength={120} required placeholder="Clinic visit or care appointment" />
      <label htmlFor="appointment-start">Date and time</label>
      <input id="appointment-start" name="startsAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "startsAtOffset")} required />
      <input type="hidden" name="startsAtOffset" defaultValue="0" />
      <label htmlFor="appointment-end">End time <span>(optional)</span></label>
      <input id="appointment-end" name="endsAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "endsAtOffset")} />
      <input type="hidden" name="endsAtOffset" defaultValue="0" />
      <label htmlFor="appointment-location">Location <span>(optional)</span></label>
      <input id="appointment-location" name="location" maxLength={200} placeholder="Clinic or video visit details" />
      <label htmlFor="appointment-notes">Notes <span>(optional)</span></label><textarea id="appointment-notes" name="notes" rows={3} maxLength={1000} />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save appointment"}</button>
    </form>
  </details>;
}
