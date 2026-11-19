"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, ClipboardList, Plus } from "lucide-react";
import { createBowelMovementRecord, createFeedingRecord, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

function CareLogForm({ patientId, kind }: { patientId: string; kind: "feeding" | "bowel" }) {
  const actionCreator = kind === "feeding" ? createFeedingRecord : createBowelMovementRecord;
  const [state, action, pending] = useActionState(actionCreator.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  const feeding = kind === "feeding";

  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">{feeding ? "FEEDING LOG" : "BOWEL MOVEMENT LOG"}</span><h2>{feeding ? "Add a feeding" : "Add a bowel movement"}</h2><p>Caregiver or patient report only; not a clinical assessment.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      {feeding ? <>
        <label htmlFor="feeding-type">Feeding type</label><select id="feeding-type" name="feedingType" defaultValue="breastfeeding"><option value="breastfeeding">Breastfeeding</option><option value="formula">Formula</option><option value="solid_food">Solid food</option><option value="other">Other</option></select>
        <label htmlFor="feeding-quantity">Quantity <span>(optional, ml)</span></label><input id="feeding-quantity" name="quantityMl" type="number" min="0" max="2000" step="0.1" inputMode="decimal" />
        <label htmlFor="feeding-duration">Duration <span>(optional, minutes)</span></label><input id="feeding-duration" name="durationMinutes" type="number" min="0" max="600" step="1" />
        <label htmlFor="feeding-notes">Observation <span>(optional)</span></label><textarea id="feeding-notes" name="notes" maxLength={500} rows={2} />
      </> : <>
        <label htmlFor="bowel-consistency">Consistency <span>(optional)</span></label><input id="bowel-consistency" name="consistency" maxLength={60} placeholder="Short description" />
        <label htmlFor="bowel-color">Colour <span>(optional)</span></label><input id="bowel-color" name="color" maxLength={60} placeholder="Short description" />
        <label htmlFor="bowel-notes">Observation <span>(optional)</span></label><textarea id="bowel-notes" name="notes" maxLength={500} rows={2} />
      </>}
      <p className="timeline-privacy-note">Use fictional data only. These logs do not give feeding, hydration, or treatment advice.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save log"}</button>
    </form>
  </details>;
}

export default function ChildCareForms({ patientId }: { patientId: string }) {
  return <><CareLogForm patientId={patientId} kind="feeding" /><CareLogForm patientId={patientId} kind="bowel" /></>;
}
