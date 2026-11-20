"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Heart, Plus } from "lucide-react";
import { createMedicalCondition, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

export default function ConditionForm({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState(createMedicalCondition.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">HEALTH CONDITIONS</span><h2>Add a condition note</h2><p>For a patient or caregiver to record existing information; this form does not diagnose.</p></div><span className="account-card-icon"><Heart size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="condition-name">Condition</label>
      <input id="condition-name" name="name" list="common-conditions" autoComplete="off" placeholder="e.g. hypertension or diabetes" maxLength={100} required />
      <datalist id="common-conditions"><option value="Hypertension" /><option value="Diabetes" /><option value="Other" /></datalist>
      <label htmlFor="condition-status">Status</label><select id="condition-status" name="status" defaultValue="active"><option value="active">Current</option><option value="historical">Past</option><option value="resolved">Resolved</option></select>
      <label htmlFor="condition-diagnosed-on">Diagnosis date <span>(optional)</span></label><input id="condition-diagnosed-on" name="diagnosedOn" type="date" />
      <label htmlFor="condition-notes">Notes <span>(optional)</span></label><textarea id="condition-notes" name="notes" rows={3} maxLength={500} placeholder="Brief context from the patient or caregiver" />
      <p className="timeline-privacy-note">Saved as unverified patient or caregiver information. It is not a diagnosis or medical advice.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save condition note"}</button>
    </form>
  </details>;
}
