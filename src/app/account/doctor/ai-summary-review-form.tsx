"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import { createAIReportReview, type AIReportReviewState } from "./patient-actions";

const initialState: AIReportReviewState = { status: "idle", message: "" };

export default function AISummaryReviewForm({ patientId, reportId }: { patientId: string; reportId: string }) {
  const [state, action, pending] = useActionState(createAIReportReview, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <form ref={formRef} action={action} className="account-profile-form timeline-form">
    <input type="hidden" name="patientId" value={patientId} />
    <input type="hidden" name="reportId" value={reportId} />
    <label htmlFor={`ai-review-outcome-${reportId}`}>Review outcome</label>
    <select id={`ai-review-outcome-${reportId}`} name="outcome" defaultValue="reviewed" required>
      <option value="reviewed">Reviewed</option>
      <option value="needs_correction">Needs correction</option>
      <option value="rejected">Not suitable for use</option>
    </select>
    <label htmlFor={`ai-review-note-${reportId}`}>Clinician review note</label>
    <textarea id={`ai-review-note-${reportId}`} name="note" rows={3} maxLength={4000} required placeholder="Explain your review for the patient and their authorized readers." />
    <p className="timeline-privacy-note">Reviews are dated, append-only, and visible to the patient and people with profile read access. This does not change the AI-generated summary.</p>
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
    <button className="primary-button account-submit" type="submit" disabled={pending}><ClipboardCheck size={16} />{pending ? "Saving review…" : "Add clinician review"}</button>
  </form>;
}
