"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { Check, ClipboardList, Plus } from "lucide-react";
import { createBowelMovementRecord, createDevelopmentalMilestone, createFeedingRecord, createGrowthRecord, createSleepRecord, createUrinationRecord, createVaccinationRecord, createVomitingRecord, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>, fieldName: string) {
  const field = event.currentTarget.form?.elements.namedItem(fieldName);
  if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
}

function CareLogForm({ patientId, kind }: { patientId: string; kind: "feeding" | "bowel" | "vomiting" | "urination" | "sleep" }) {
  const actionCreator = kind === "feeding" ? createFeedingRecord : kind === "bowel" ? createBowelMovementRecord : kind === "vomiting" ? createVomitingRecord : kind === "urination" ? createUrinationRecord : createSleepRecord;
  const [state, action, pending] = useActionState(actionCreator.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  const feeding = kind === "feeding";
  const vomiting = kind === "vomiting";
  const urination = kind === "urination";
  const sleep = kind === "sleep";

  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">{feeding ? "FEEDING LOG" : vomiting ? "VOMITING LOG" : urination ? "URINATION LOG" : sleep ? "SLEEP LOG" : "BOWEL MOVEMENT LOG"}</span><h2>{feeding ? "Add a feeding" : vomiting ? "Add a vomiting episode" : urination ? "Add a urination entry" : sleep ? "Add a sleep period" : "Add a bowel movement"}</h2><p>Caregiver or patient report only; not a clinical assessment.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      {feeding ? <>
        <label htmlFor="feeding-type">Feeding type</label><select id="feeding-type" name="feedingType" defaultValue="breastfeeding"><option value="breastfeeding">Breastfeeding</option><option value="formula">Formula</option><option value="solid_food">Solid food</option><option value="other">Other</option></select>
        <label htmlFor="feeding-quantity">Quantity <span>(optional, ml)</span></label><input id="feeding-quantity" name="quantityMl" type="number" min="0" max="2000" step="0.1" inputMode="decimal" />
        <label htmlFor="feeding-duration">Duration <span>(optional, minutes)</span></label><input id="feeding-duration" name="durationMinutes" type="number" min="0" max="600" step="1" />
        <label htmlFor="feeding-notes">Observation <span>(optional)</span></label><textarea id="feeding-notes" name="notes" maxLength={500} rows={2} />
      </> : vomiting ? <>
        <label htmlFor="vomiting-count">Number of episodes</label><input id="vomiting-count" name="count" type="number" min="1" max="50" step="1" defaultValue="1" required />
        <label htmlFor="vomiting-notes">Associated observations <span>(optional)</span></label><textarea id="vomiting-notes" name="associatedNotes" maxLength={500} rows={2} />
      </> : urination ? <>
        <label htmlFor="urination-type">Type</label><select id="urination-type" name="urinationType" defaultValue="wet_diaper"><option value="wet_diaper">Wet diaper</option><option value="toilet">Toilet</option><option value="other">Other</option></select>
        <label htmlFor="urination-count">Number recorded</label><input id="urination-count" name="count" type="number" min="1" max="100" step="1" defaultValue="1" required />
        <label htmlFor="urination-volume">Volume <span>(optional, ml)</span></label><input id="urination-volume" name="volumeMl" type="number" min="0.1" max="2000" step="0.1" inputMode="decimal" />
        <label htmlFor="urination-notes">Observation <span>(optional)</span></label><textarea id="urination-notes" name="notes" maxLength={500} rows={2} />
      </> : sleep ? <>
        <label htmlFor="sleep-type">Type</label><select id="sleep-type" name="sleepType" defaultValue="overnight"><option value="nap">Nap</option><option value="overnight">Overnight</option><option value="other">Other</option></select>
        <label htmlFor="sleep-start">Start date and time</label><input id="sleep-start" name="startedAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "startedAtOffset")} required /><input type="hidden" name="startedAtOffset" defaultValue="0" />
        <label htmlFor="sleep-end">End date and time</label><input id="sleep-end" name="endedAt" type="datetime-local" onChange={(event) => updateTimezoneOffset(event, "endedAtOffset")} required /><input type="hidden" name="endedAtOffset" defaultValue="0" />
        <label htmlFor="sleep-notes">Observation <span>(optional)</span></label><textarea id="sleep-notes" name="notes" maxLength={500} rows={2} />
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

export default function ChildCareForms({ patientId, vaccinationDocuments = [] }: { patientId: string; vaccinationDocuments?: Array<{ id: string; display_name: string }> }) {
  const [growthState, growthAction, growthPending] = useActionState(createGrowthRecord.bind(null, patientId), initialState);
  const growthFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (growthState.status === "success") growthFormRef.current?.reset(); }, [growthState]);
  const [vaccinationState, vaccinationAction, vaccinationPending] = useActionState(createVaccinationRecord.bind(null, patientId), initialState);
  const vaccinationFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (vaccinationState.status === "success") vaccinationFormRef.current?.reset(); }, [vaccinationState]);
  const [milestoneState, milestoneAction, milestonePending] = useActionState(createDevelopmentalMilestone.bind(null, patientId), initialState);
  const milestoneFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (milestoneState.status === "success") milestoneFormRef.current?.reset(); }, [milestoneState]);
  return <>
    <CareLogForm patientId={patientId} kind="feeding" />
    <CareLogForm patientId={patientId} kind="bowel" />
    <CareLogForm patientId={patientId} kind="vomiting" />
    <CareLogForm patientId={patientId} kind="urination" />
    <CareLogForm patientId={patientId} kind="sleep" />
    <details className="account-card account-entry-disclosure">
      <summary className="account-card-heading"><div><span className="micro-label">VACCINATION RECORD</span><h2>Track a vaccination</h2><p>Dates are caregiver-entered; MedVita does not generate a vaccine schedule or send reminders.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
      <form ref={vaccinationFormRef} action={vaccinationAction} className="account-profile-form timeline-form">
        <label htmlFor="vaccine-name">Vaccine name</label><input id="vaccine-name" name="vaccineName" minLength={2} maxLength={100} required />
        <label htmlFor="vaccine-dose">Dose or series label <span>(optional)</span></label><input id="vaccine-dose" name="doseLabel" maxLength={60} placeholder="For example, dose 1" />
        <label htmlFor="vaccine-status">Record status</label><select id="vaccine-status" name="status" defaultValue="planned"><option value="planned">Planned</option><option value="administered">Administered</option><option value="cancelled">Cancelled</option></select>
        <label htmlFor="vaccine-due">Planned or next due date <span>(required when planned)</span></label><input id="vaccine-due" name="dueOn" type="date" />
        <label htmlFor="vaccine-administered">Administered date <span>(required when administered)</span></label><input id="vaccine-administered" name="administeredOn" type="date" />
        <label htmlFor="vaccine-document">Vaccination document <span>(optional)</span></label><select id="vaccine-document" name="documentId" defaultValue=""><option value="">No document selected</option>{vaccinationDocuments.map((document) => <option key={document.id} value={document.id}>{document.display_name}</option>)}</select>
        <label htmlFor="vaccine-notes">Notes <span>(optional)</span></label><textarea id="vaccine-notes" name="notes" maxLength={500} rows={2} />
        <p className="timeline-privacy-note">Use the child&apos;s clinician or official local schedule to confirm due dates. This record is not a vaccination recommendation.</p>
        {vaccinationState.message && <p className={`account-form-message ${vaccinationState.status}`} role="status">{vaccinationState.status === "success" && <Check size={15} />}{vaccinationState.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={vaccinationPending}><Plus size={16} />{vaccinationPending ? "Saving…" : "Save vaccination"}</button>
      </form>
    </details>
    <details className="account-card account-entry-disclosure">
      <summary className="account-card-heading"><div><span className="micro-label">DEVELOPMENT NOTES</span><h2>Record an observation</h2><p>Enter what you observed. The app does not assess development or compare with age norms.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
      <form ref={milestoneFormRef} action={milestoneAction} className="account-profile-form timeline-form">
        <label htmlFor="milestone-name">Milestone or observation</label><input id="milestone-name" name="milestoneName" minLength={2} maxLength={100} required />
        <label htmlFor="milestone-domain">Area</label><select id="milestone-domain" name="domain" defaultValue="motor"><option value="motor">Movement</option><option value="communication">Communication</option><option value="cognitive">Thinking and learning</option><option value="social_emotional">Social and emotional</option><option value="self_care">Self-care</option><option value="other">Other</option></select>
        <label htmlFor="milestone-status">Observation</label><select id="milestone-status" name="status" defaultValue="observed"><option value="observed">Observed</option><option value="not_observed">Not observed</option><option value="follow_up">Follow-up planned</option></select>
        <label htmlFor="milestone-recorded">Observation date</label><input id="milestone-recorded" name="recordedOn" type="date" required />
        <label htmlFor="milestone-follow-up">Follow-up date <span>(required when follow-up is planned)</span></label><input id="milestone-follow-up" name="followUpOn" type="date" />
        <label htmlFor="milestone-notes">Caregiver notes <span>(optional)</span></label><textarea id="milestone-notes" name="notes" maxLength={500} rows={2} />
        <p className="timeline-privacy-note">This is a caregiver record, not a developmental screening. Discuss questions or concerns with the child&apos;s clinician; this prototype does not send follow-up reminders.</p>
        {milestoneState.message && <p className={`account-form-message ${milestoneState.status}`} role="status">{milestoneState.status === "success" && <Check size={15} />}{milestoneState.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={milestonePending}><Plus size={16} />{milestonePending ? "Saving…" : "Save observation"}</button>
      </form>
    </details>
    <details className="account-card account-entry-disclosure">
      <summary className="account-card-heading"><div><span className="micro-label">GROWTH MEASUREMENT</span><h2>Add a measurement</h2><p>Unverified measurements only; no growth percentile or assessment.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
      <form ref={growthFormRef} action={growthAction} className="account-profile-form timeline-form">
        <label htmlFor="growth-weight">Weight <span>(kg, optional)</span></label><input id="growth-weight" name="weightKg" type="number" min="0.01" max="200" step="0.01" inputMode="decimal" />
        <label htmlFor="growth-height">Height or length <span>(cm, optional)</span></label><input id="growth-height" name="heightCm" type="number" min="0.01" max="250" step="0.01" inputMode="decimal" />
        <label htmlFor="growth-head">Head circumference <span>(cm, optional)</span></label><input id="growth-head" name="headCircumferenceCm" type="number" min="0.01" max="100" step="0.01" inputMode="decimal" />
        <p className="timeline-privacy-note">Enter at least one value. The measurements are saved as unverified and are not compared with clinical growth standards.</p>
        {growthState.message && <p className={`account-form-message ${growthState.status}`} role="status">{growthState.status === "success" && <Check size={15} />}{growthState.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={growthPending}><Plus size={16} />{growthPending ? "Saving…" : "Save measurement"}</button>
      </form>
    </details>
  </>;
}
