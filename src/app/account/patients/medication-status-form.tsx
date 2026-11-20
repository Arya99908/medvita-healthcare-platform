"use client";

import { useActionState } from "react";
import { updateMedicationStatus, type MedicationStatusFormState } from "./actions";

const initialState: MedicationStatusFormState = { status: "idle", message: "" };

export default function MedicationStatusForm({ patientId, medicationId, status }: { patientId: string; medicationId: string; status: string }) {
  const actionForPatient = updateMedicationStatus.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);

  return <form action={action} className="medication-status-form">
    <input type="hidden" name="medicationId" value={medicationId} />
    <label htmlFor={`medication-status-${medicationId}`}>List status</label>
    <div className="medication-status-controls"><select id={`medication-status-${medicationId}`} name="status" defaultValue={status}><option value="active">Current</option><option value="paused">Paused</option><option value="discontinued">Discontinued</option><option value="historical">Past or stopped</option></select><button type="submit" className="account-record-link" disabled={pending}>{pending ? "Saving…" : "Save status"}</button></div>
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
  </form>;
}
