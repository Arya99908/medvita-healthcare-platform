"use client";

import { useActionState } from "react";
import { Download, Share2 } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { createCaregiverHandover, type CareLogFormState } from "./actions";

type Recipient = { user_id: string; relationship_role: string };
type Handover = { id: string; from_user_id: string | null; to_user_id: string | null; handover_text: string; created_at: string };
const initialState: CareLogFormState = { status: "idle", message: "" };

function downloadSnapshot(handover: Handover, patientId: string) {
  const blob = new Blob([handover.handover_text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `medvita-handover-${patientId.slice(0, 8)}-${handover.created_at.slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CaregiverHandoverPanel({ patientId, currentUserId, lifeStage, recipients, handovers, canWrite, loadError }: { patientId: string; currentUserId: string; lifeStage: string; recipients: Recipient[]; handovers: Handover[]; canWrite: boolean; loadError: boolean }) {
  const [state, action, pending] = useActionState(createCaregiverHandover.bind(null, patientId), initialState);
  const recipientLabel = (userId: string | null) => {
    if (!userId) return "Profile care team";
    const recipient = recipients.find((item) => item.user_id === userId);
    if (!recipient) return `Linked account ending ${userId.slice(-4)}`;
    return `${recipient.relationship_role.replaceAll("_", " ")} · account ending ${userId.slice(-4)}`;
  };

  return <section className="account-card caregiver-handover-panel" aria-labelledby="caregiver-handover-title">
    <div className="account-card-heading"><div><span className="micro-label">CAREGIVER COORDINATION</span><h2 id="caregiver-handover-title">Health handover</h2><p>Create a point-in-time summary from records this account can read.</p></div><span className="account-card-icon"><Share2 size={18} /></span></div>
    <div className="handover-safety-note">The saved handover excludes sensitive adolescent records and is marked unverified. It does not change access permissions or notify the recipient.</div>
    {canWrite && <form action={action} className="handover-create-form">
      <label htmlFor="handover-recipient">Share record with</label>
      <select id="handover-recipient" name="toUserId" defaultValue=""><option value="">Profile care team (all current readers)</option>{recipients.filter(({ user_id }) => user_id !== currentUserId).map((recipient) => <option key={recipient.user_id} value={recipient.user_id}>{recipient.relationship_role.replaceAll("_", " ")} · account ending {recipient.user_id.slice(-4)}</option>)}</select>
      {lifeStage === "adolescent" ? <p className="handover-privacy-note">Free-text handover notes are disabled for adolescent profiles. Sensitive adolescent records are excluded from this summary.</p> : <><label htmlFor="handover-note">Additional handover note <span>(optional)</span></label><textarea id="handover-note" name="note" maxLength={500} rows={3} placeholder="Brief care coordination note" /></>}
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
      <button className="account-record-link" type="submit" disabled={pending}>{pending ? "Preparing…" : "Create and save handover"}</button>
    </form>}
    {loadError ? <div className="account-empty-state"><strong>Handover history could not be loaded</strong><span>Refresh the profile to try again.</span></div> : handovers.length ? <div className="handover-history"><h3>Saved handovers</h3>{handovers.map((handover) => <details key={handover.id} className="handover-history-entry"><summary><span>{handover.from_user_id === currentUserId ? "Created by you" : `Created by ${recipientLabel(handover.from_user_id)}`} · for {recipientLabel(handover.to_user_id)}</span><LocalDateTime value={handover.created_at} /></summary><pre>{handover.handover_text}</pre><button className="account-record-link" type="button" onClick={() => downloadSnapshot(handover, patientId)}><Download size={14} /> Download text snapshot</button></details>)}</div> : <p className="handover-empty">No handovers saved for this profile.</p>}
  </section>;
}
