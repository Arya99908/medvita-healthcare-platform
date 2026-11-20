"use client";

import { useActionState } from "react";
import { AlertTriangle, Check, Clock3, X } from "lucide-react";
import { requestAccountDeletion, withdrawAccountDeletionRequest, type DeletionRequestState } from "./deletion-actions";

type Request = { id: string; requested_at: string; status: string; review_note: string | null };
const initialState: DeletionRequestState = { status: "idle", message: "" };
const statusLabels: Record<string, string> = {
  requested: "Waiting for review",
  withdrawn: "Withdrawn",
  ready_for_manual_processing: "Approved for manual processing",
  retention_review: "Retention review needed",
  declined: "Request declined",
};

function WithdrawRequest({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(withdrawAccountDeletionRequest, initialState);
  return <form action={action} className="deletion-withdraw-form">
    <input type="hidden" name="requestId" value={requestId} />
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
    <button className="secondary-button" type="submit" disabled={pending}>{pending ? "Withdrawing…" : "Withdraw request"}</button>
  </form>;
}

export default function AccountDeletionPanel({ requests, loadError }: { requests: Request[]; loadError: boolean }) {
  const [state, action, pending] = useActionState(requestAccountDeletion, initialState);
  const latest = requests[0];
  const reviewInProgress = latest && ["requested", "ready_for_manual_processing", "retention_review"].includes(latest.status);
  return <section className="account-card account-deletion-panel" aria-labelledby="account-deletion-title">
    <div className="account-card-heading"><div><span className="micro-label">ACCOUNT CONTROL</span><h2 id="account-deletion-title">Account deletion</h2><p>Request a review of your account and linked profiles.</p></div><span className="account-card-icon"><AlertTriangle size={18} /></span></div>
    <div className="account-deletion-warning"><AlertTriangle size={16} /><p>Submitting a request does not immediately delete your account or health records. A platform administrator must review linked profiles and retention requirements. This prototype does not yet execute permanent deletion.</p></div>
    {loadError ? <p className="account-form-message error" role="status">Your request status could not be loaded. Refresh the page before submitting another request.</p>
      : latest && <div className="deletion-request-status"><div><strong>{statusLabels[latest.status] ?? "Request received"}</strong><span>Requested {new Date(latest.requested_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>{latest.review_note && <p>{latest.review_note}</p>}</div><span className={`account-status ${latest.status === "requested" ? "pending" : latest.status === "declined" || latest.status === "withdrawn" ? "inactive" : "active"}`}>{latest.status === "requested" ? <Clock3 size={13} /> : latest.status === "declined" || latest.status === "withdrawn" ? <X size={13} /> : <Check size={13} />}{statusLabels[latest.status] ?? "Reviewed"}</span></div>}
    {latest?.status === "requested" && <WithdrawRequest requestId={latest.id} />}
    {!loadError && !reviewInProgress && <details className="deletion-request-disclosure">
      <summary>Request account deletion</summary>
      <form action={action} className="account-deletion-form">
        <label htmlFor="account-delete-password">Current password</label>
        <input id="account-delete-password" name="password" type="password" autoComplete="current-password" required maxLength={256} />
        {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
        <button className="secondary-button" type="submit" disabled={pending}>{pending ? "Sending request…" : "Confirm identity and request review"}</button>
      </form>
    </details>}
  </section>;
}
