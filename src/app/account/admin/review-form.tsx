"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { reviewDoctorApplication, type ReviewDoctorState } from "./actions";

const initialState: ReviewDoctorState = { status: "idle", message: "" };

export default function DoctorReviewForm({ doctorId }: { doctorId: string }) {
  const [state, action, pending] = useActionState(reviewDoctorApplication, initialState);
  return <form action={action} className="admin-review-form">
    <input type="hidden" name="doctorId" value={doctorId} />
    <label htmlFor={`reason-${doctorId}`}>Review note <span>(required to reject)</span></label>
    <textarea id={`reason-${doctorId}`} name="reason" maxLength={500} rows={2} placeholder="Explain the decision or what needs correction" />
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
    <div className="admin-review-actions">
      <button className="primary-button" name="decision" value="verified" disabled={pending}><Check size={15} /> Verify profile</button>
      <button className="secondary-button" name="decision" value="rejected" disabled={pending}><X size={15} /> Reject application</button>
    </div>
  </form>;
}
