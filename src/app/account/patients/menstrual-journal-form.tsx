"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Heart, Plus } from "lucide-react";
import { createMenstrualRecord, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

export default function MenstrualJournalForm({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState(createMenstrualRecord.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">PRIVATE ADOLESCENT JOURNAL</span><h2>Add a cycle note</h2><p>Visible only to the adolescent account and people with explicit consent.</p></div><span className="account-card-icon"><Heart size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="period-start">Period start date</label><input id="period-start" name="periodStart" type="date" required />
      <label htmlFor="period-end">Period end date <span>(optional)</span></label><input id="period-end" name="periodEnd" type="date" />
      <label htmlFor="flow-note">Flow observation <span>(optional)</span></label><textarea id="flow-note" name="flowNote" maxLength={300} rows={2} />
      <label htmlFor="cycle-symptoms">Symptoms or personal note <span>(optional)</span></label><textarea id="cycle-symptoms" name="symptomNote" maxLength={500} rows={3} />
      <p className="timeline-privacy-note">This private record is stored with sensitive-adolescent visibility. It does not provide health advice or make reproductive-health inferences.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save private note"}</button>
    </form>
  </details>;
}
