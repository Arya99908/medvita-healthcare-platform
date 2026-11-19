"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { Check, Plus } from "lucide-react";
import { createHealthEvent, type HealthEventFormState } from "./actions";

const initialState: HealthEventFormState = { status: "idle", message: "" };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>) {
  const field = event.currentTarget.form?.elements.namedItem("occurredAtOffset");
  if (field instanceof HTMLInputElement) {
    field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
  }
}

export default function HealthEventForm({ patientId, lifeStage }: { patientId: string; lifeStage: string }) {
  const actionForPatient = createHealthEvent.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return <section className="account-card" aria-labelledby="add-event-title">
    <div className="account-card-heading"><div><span className="micro-label">PERSONAL TIMELINE</span><h2 id="add-event-title">Add a note</h2><p>New entries are marked unverified and follow this profile&apos;s access rules.</p></div><span className="account-card-icon"><Plus size={18} /></span></div>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="event-title">Title</label>
      <input id="event-title" name="title" minLength={2} maxLength={120} required placeholder="A short note title" />

      <label htmlFor="event-type">Entry type</label>
      <select id="event-type" name="eventType" defaultValue="care_note" required>
        <option value="care_note">Care note</option>
        <option value="symptom">Symptom observation</option>
        <option value="visit">Care visit</option>
        <option value="test_result">Test result reference</option>
        <option value="other">Other</option>
      </select>

      <label htmlFor="event-description">Details <span>(optional)</span></label>
      <textarea id="event-description" name="description" maxLength={2000} rows={4} placeholder="Add a brief personal note" />

      <label htmlFor="event-occurred-at">Date and time <span>(optional)</span></label>
      <input id="event-occurred-at" name="occurredAt" type="datetime-local" onChange={updateTimezoneOffset} />
      <input type="hidden" name="occurredAtOffset" defaultValue="0" />

      {lifeStage === "adolescent" && <>
        <label htmlFor="event-visibility">Privacy</label>
        <select id="event-visibility" name="visibility" defaultValue="general">
          <option value="general">General profile entry</option>
          <option value="sensitive_adolescent">Sensitive adolescent entry</option>
        </select>
        <p className="timeline-privacy-note">Sensitive entries are visible only to the patient and people with explicit consent.</p>
      </>}
      {lifeStage !== "adolescent" && <input type="hidden" name="visibility" value="general" />}

      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save note"}</button>
    </form>
  </section>;
}
