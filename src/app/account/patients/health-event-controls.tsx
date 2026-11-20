"use client";

import { useActionState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteHealthEvent, updateHealthEvent, type HealthEventFormState } from "./actions";

const initialState: HealthEventFormState = { status: "idle", message: "" };
const eventTypes = ["care_note", "symptom", "visit", "test_result", "other"] as const;

export default function HealthEventControls({ patientId, eventId, eventType, title, description }: {
  patientId: string;
  eventId: string;
  eventType: string;
  title: string;
  description: string | null;
}) {
  const [updateState, updateAction, updating] = useActionState(updateHealthEvent, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteHealthEvent, initialState);
  return <div className="health-event-controls">
    <details className="health-event-edit">
      <summary><Pencil size={14} /> Edit your note</summary>
      <form action={updateAction} className="account-profile-form timeline-form">
        <input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="eventId" value={eventId} />
        <label htmlFor={`health-event-title-${eventId}`}>Title</label><input id={`health-event-title-${eventId}`} name="title" defaultValue={title} minLength={2} maxLength={120} required />
        <label htmlFor={`health-event-type-${eventId}`}>Entry type</label><select id={`health-event-type-${eventId}`} name="eventType" defaultValue={eventTypes.includes(eventType as typeof eventTypes[number]) ? eventType : "other"}>{eventTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
        <label htmlFor={`health-event-description-${eventId}`}>Details</label><textarea id={`health-event-description-${eventId}`} name="description" defaultValue={description ?? ""} maxLength={2000} rows={4} />
        <p className="timeline-privacy-note">The recorded date, privacy scope, and unverified status are kept.</p>
        {updateState.message && <p className={`account-form-message ${updateState.status}`} role="status">{updateState.message}</p>}
        <button className="secondary-button" type="submit" disabled={updating}>{updating ? "Saving…" : "Save changes"}</button>
      </form>
    </details>
    <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("Remove this note from the profile? The activity history will retain a removal event.")) event.preventDefault(); }}>
      <input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="eventId" value={eventId} />
      <button className="health-event-delete" type="submit" disabled={deleting}><Trash2 size={14} />{deleting ? "Removing…" : "Remove your note"}</button>
      {deleteState.message && <p className={`account-form-message ${deleteState.status}`} role="status">{deleteState.message}</p>}
    </form>
  </div>;
}
