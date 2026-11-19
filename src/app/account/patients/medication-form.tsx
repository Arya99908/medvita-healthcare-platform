"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Pill, Plus } from "lucide-react";
import { createMedication, type MedicationFormState } from "./actions";

const initialState: MedicationFormState = { status: "idle", message: "" };

export default function MedicationForm({ patientId, lifeStage }: { patientId: string; lifeStage: string }) {
  const actionForPatient = createMedication.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return <section className="account-card" aria-labelledby="medication-form-title">
    <div className="account-card-heading"><div><span className="micro-label">MEDICINE NOTES</span><h2 id="medication-form-title">Add a medicine</h2><p>Enter the details from a package or care record. This does not prescribe or check a dose.</p></div><span className="account-card-icon"><Pill size={18} /></span></div>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="medicine-name">Medicine name</label>
      <input id="medicine-name" name="medicineName" minLength={2} maxLength={120} required placeholder="Name as written on the package" />
      <label htmlFor="medicine-status">List status</label>
      <select id="medicine-status" name="status" defaultValue="active"><option value="active">Listed as current</option><option value="historical">Past or stopped</option></select>
      <details className="medication-optional-fields">
        <summary>Add package details (optional)</summary>
        <div className="medication-optional-grid">
          <label htmlFor="medicine-generic">Generic name</label>
          <input id="medicine-generic" name="genericName" maxLength={120} />
          <label htmlFor="medicine-strength">Strength as printed</label>
          <input id="medicine-strength" name="strength" maxLength={80} placeholder="As written on the package" />
          <label htmlFor="medicine-route">How it is taken</label>
          <input id="medicine-route" name="route" maxLength={80} placeholder="For example, by mouth or on skin" />
          <label htmlFor="medicine-instructions">Directions as recorded</label>
          <textarea id="medicine-instructions" name="instructions" maxLength={500} rows={3} placeholder="Copy existing directions; do not use this field to change a dose" />
        </div>
      </details>
      {lifeStage === "adolescent" ? <>
        <label htmlFor="medicine-visibility">Privacy</label>
        <select id="medicine-visibility" name="visibility" defaultValue="general"><option value="general">General profile entry</option><option value="sensitive_adolescent">Sensitive adolescent entry</option></select>
        <p className="timeline-privacy-note">Sensitive entries follow the profile&apos;s explicit consent rules.</p>
      </> : <input type="hidden" name="visibility" value="general" />}
      <p className="timeline-privacy-note">Medicine notes are self-reported and unverified. Follow your clinician&apos;s instructions.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save medicine note"}</button>
    </form>
  </section>;
}
