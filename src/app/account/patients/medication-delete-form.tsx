"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteMedicationNote, type MedicationFormState } from "./actions";

const initialState: MedicationFormState = { status: "idle", message: "" };

export default function MedicationDeleteForm({ patientId, medicationId, status }: {
  patientId: string;
  medicationId: string;
  status: string;
}) {
  const removeForMedication = deleteMedicationNote.bind(null, patientId, medicationId);
  const [state, action, pending] = useActionState(removeForMedication, initialState);
  const canRemove = status === "discontinued" || status === "historical";

  return <div className="medication-delete-control">
    {canRemove ? <form action={action} onSubmit={(event) => {
      if (!window.confirm("Remove this discontinued or historical self-reported note? Notes with linked schedules or dose history will be kept.")) event.preventDefault();
    }}>
      <input type="hidden" name="confirmRemove" value="remove" />
      <button className="health-event-delete" type="submit" disabled={pending}><Trash2 size={14} />{pending ? "Removing…" : "Remove my note"}</button>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
    </form> : <p className="timeline-privacy-note">To remove this note, first mark it discontinued or move it to history. Active or paused notes remain listed.</p>}
  </div>;
}
