"use client";

import { useActionState, useEffect, useRef } from "react";
import { Activity, Check, Plus } from "lucide-react";
import { createSymptomObservation, type HealthEventFormState } from "./actions";

const initialState: HealthEventFormState = { status: "idle", message: "" };

export default function SymptomForm({ patientId, lifeStage }: { patientId: string; lifeStage: string }) {
  const actionForPatient = createSymptomObservation.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <details className="account-card account-entry-disclosure" aria-labelledby="symptom-form-title">
    <summary className="account-card-heading"><div><span className="micro-label">SYMPTOM LOG</span><h2 id="symptom-form-title">Add an observation</h2><p>Self-reported only; this does not assess urgency or diagnose.</p></div><span className="account-card-icon"><Activity size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="symptom-name">What did you notice?</label><input id="symptom-name" name="symptom" minLength={2} maxLength={120} required placeholder="A short description" />
      <label htmlFor="symptom-severity">How noticeable was it?</label><select id="symptom-severity" name="severity" defaultValue="3"><option value="1">1 · Very mild</option><option value="2">2 · Mild</option><option value="3">3 · Moderate</option><option value="4">4 · Strong</option><option value="5">5 · Very strong</option></select>
      <label htmlFor="symptom-notes">Extra note <span>(optional)</span></label><textarea id="symptom-notes" name="notes" maxLength={500} rows={3} />
      {lifeStage === "adolescent" ? <><label htmlFor="symptom-visibility">Privacy</label><select id="symptom-visibility" name="visibility" defaultValue="general"><option value="general">General profile entry</option><option value="sensitive_adolescent">Sensitive adolescent entry</option></select></> : <input type="hidden" name="visibility" value="general" />}
      <p className="timeline-privacy-note">Use fictional data only. Seek appropriate care for health concerns; this log does not provide medical advice.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save observation"}</button>
    </form>
  </details>;
}
