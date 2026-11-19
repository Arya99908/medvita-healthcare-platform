"use client";

import { useActionState } from "react";
import { updateMedicationStatus, type MedicationStatusFormState } from "./actions";

const initialState: MedicationStatusFormState = { status: "idle", message: "" };

export default function MedicationStatusForm({ patientId, medicationId, status }: { patientId: string; medicationId: string; status: string }) {
  const nextStatus = status === "active" ? "historical" : "active";
  const actionForPatient = updateMedicationStatus.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);

  return <form action={action} className="medication-status-form">
    <input type="hidden" name="medicationId" value={medicationId} />
    <input type="hidden" name="status" value={nextStatus} />
    <button type="submit" className="account-record-link" disabled={pending}>{pending ? "Saving…" : status === "active" ? "Mark as past or stopped" : "List as current"}</button>
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
  </form>;
}
