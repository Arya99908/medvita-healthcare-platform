"use client";

import { useActionState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { reviewAccountDeletionRequest, type ReviewDoctorState } from "./actions";

const initialState: ReviewDoctorState = { status: "idle", message: "" };

export default function AccountDeletionReviewForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(reviewAccountDeletionRequest, initialState);
  return <form action={action} className="admin-review-form">
    <input type="hidden" name="requestId" value={requestId} />
    <label htmlFor={`deletion-note-${requestId}`}>Review note <span>(required)</span></label>
    <textarea id={`deletion-note-${requestId}`} name="note" minLength={5} maxLength={500} required rows={2} placeholder="Explain the retention review or manual next step" />
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
    <div className="admin-review-actions">
      <button className="primary-button" name="decision" value="ready_for_manual_processing" disabled={pending}><Check size={15} /> Ready for manual processing</button>
      <button className="secondary-button" name="decision" value="retention_review" disabled={pending}><Clock3 size={15} /> Retention review needed</button>
      <button className="secondary-button" name="decision" value="declined" disabled={pending}><X size={15} /> Decline request</button>
    </div>
  </form>;
}
