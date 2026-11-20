"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, FilePlus2 } from "lucide-react";
import { createClinicalNote, type ClinicalNoteState } from "./patient-actions";

const initialState: ClinicalNoteState = { status: "idle", message: "" };
type NoteOption = { id: string; title: string; created_at: string };

export default function ClinicalNoteForm({ patientId, notes }: { patientId: string; notes: NoteOption[] }) {
  const [state, action, pending] = useActionState(createClinicalNote, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">CLINICIAN RECORD</span><h2>Add a clinical note</h2><p>Append a dated clinician-authored consultation, plan, or follow-up.</p></div><span className="account-card-icon"><FilePlus2 size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <input type="hidden" name="patientId" value={patientId} />
      <label htmlFor="clinical-note-kind">Note type</label>
      <select id="clinical-note-kind" name="noteKind" defaultValue="consultation" required>
        <option value="consultation">Consultation summary</option>
        <option value="treatment_plan">Care plan note</option>
        <option value="follow_up">Follow-up recommendation</option>
        <option value="addendum">Correction or addendum</option>
      </select>
      <label htmlFor="clinical-note-title">Title</label>
      <input id="clinical-note-title" name="title" minLength={2} maxLength={160} required placeholder="Short note title" />
      <label htmlFor="clinical-note-body">Clinician note</label>
      <textarea id="clinical-note-body" name="body" rows={5} maxLength={8000} required placeholder="Enter information you want the patient and their authorized readers to see." />
      <label htmlFor="clinical-note-follow-up">Follow-up date <span>(optional)</span></label>
      <input id="clinical-note-follow-up" name="followUpOn" type="date" />
      <label htmlFor="clinical-note-amends">Amends a previous note <span>(required for an addendum)</span></label>
      <select id="clinical-note-amends" name="amendsNoteId" defaultValue="">
        <option value="">No previous note selected</option>
        {notes.map((note) => <option key={note.id} value={note.id}>{note.title} · {new Date(`${note.created_at}`).toLocaleDateString()}</option>)}
      </select>
      <p className="timeline-privacy-note">Notes are append-only and visible to the patient and people with profile read access. Corrections are recorded as addenda. This does not issue prescriptions.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><FilePlus2 size={16} />{pending ? "Saving…" : "Add clinician note"}</button>
    </form>
  </details>;
}
