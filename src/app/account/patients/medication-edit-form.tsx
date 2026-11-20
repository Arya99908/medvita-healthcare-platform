"use client";

import { useActionState } from "react";
import { Check, Pencil } from "lucide-react";
import { updateMedicationDetails, type MedicationFormState } from "./actions";

const initialState: MedicationFormState = { status: "idle", message: "" };

type Medication = { id: string; medicine_name: string; generic_name: string | null; strength: string | null; route: string | null; instructions: string | null };

export default function MedicationEditForm({ patientId, medication }: { patientId: string; medication: Medication }) {
  const updateForMedication = updateMedicationDetails.bind(null, patientId, medication.id);
  const [state, action, pending] = useActionState(updateForMedication, initialState);

  return <details className="medication-edit-disclosure">
    <summary className="account-record-link"><Pencil size={14} /> Edit my note</summary>
    <form action={action} className="medication-edit-form">
      <p>Only the note details can be changed here. Its current or past status, schedules, and dose events are kept.</p>
      <label>Medicine name<input name="medicineName" defaultValue={medication.medicine_name} minLength={2} maxLength={120} required /></label>
      <label>Generic name (optional)<input name="genericName" defaultValue={medication.generic_name ?? ""} maxLength={120} /></label>
      <label>Strength as recorded<input name="strength" defaultValue={medication.strength ?? ""} maxLength={80} /></label>
      <label>How it is taken<input name="route" defaultValue={medication.route ?? ""} maxLength={80} /></label>
      <label>Directions as recorded<textarea name="instructions" defaultValue={medication.instructions ?? ""} rows={3} maxLength={500} /></label>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={14} />}{state.message}</p>}
      <button type="submit" className="account-record-link" disabled={pending}>{pending ? "Saving…" : "Save note changes"}</button>
    </form>
  </details>;
}
