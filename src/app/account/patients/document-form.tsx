"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, FilePlus2, Plus } from "lucide-react";
import { uploadPatientDocument, type DocumentFormState } from "./actions";

const initialState: DocumentFormState = { status: "idle", message: "" };

export default function DocumentForm({ patientId, lifeStage }: { patientId: string; lifeStage: string }) {
  const actionForPatient = uploadPatientDocument.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return <details className="account-card account-entry-disclosure" aria-labelledby="document-form-title">
    <summary className="account-card-heading"><div><span className="micro-label">PRIVATE FILES</span><h2 id="document-form-title">Add a document</h2><p>PDF, JPG, or PNG, up to 4 MB. Files stay private to this profile&apos;s access rules.</p></div><span className="account-card-icon"><FilePlus2 size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="document-label">Document label</label>
      <input id="document-label" name="displayName" minLength={2} maxLength={80} required placeholder="A short label; do not enter real health data" />
      <label htmlFor="document-type">Type</label>
      <select id="document-type" name="documentType" defaultValue="other"><option value="care_summary">Care summary</option><option value="test_result">Test result</option><option value="prescription_copy">Prescription copy</option><option value="vaccination_certificate">Vaccination certificate</option><option value="other">Other</option></select>
      <label htmlFor="document-date">Document date <span>(optional)</span></label>
      <input id="document-date" name="documentDate" type="date" />
      <label htmlFor="document-file">Choose a file</label>
      <input id="document-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
      {lifeStage === "adolescent" ? <>
        <label htmlFor="document-visibility">Privacy</label>
        <select id="document-visibility" name="visibility" defaultValue="general"><option value="general">General profile file</option><option value="sensitive_adolescent">Sensitive adolescent file</option></select>
      </> : <input type="hidden" name="visibility" value="general" />}
      <p className="timeline-privacy-note">Use fictional files only. Optional OCR runs on this device and does not use AI. The file name is not stored.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Uploading…" : "Upload document"}</button>
    </form>
  </details>;
}
