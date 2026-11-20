"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { createPatientInvitation, revokePatientInvitation, revokePatientRelationship, type InvitationActionState } from "./actions";

type Invitation = { id: string; invited_email: string; relationship_role: string; can_write: boolean; expires_at: string; accepted_at: string | null; revoked_at: string | null };
type LinkedRelationship = { id: string; user_id: string; relationship_role: string; can_write: boolean };
const initialState: InvitationActionState = { status: "idle", message: "" };

export default function InvitationPanel({ patientId, invitations, relationships, loadError }: { patientId: string; invitations: Invitation[]; relationships: LinkedRelationship[]; loadError: boolean }) {
  const [state, action, pending] = useActionState(createPatientInvitation.bind(null, patientId), initialState);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  const activeInvitations = invitations.filter((item) => !item.accepted_at && !item.revoked_at);

  return <section className="account-card caregiver-invitation-panel" aria-labelledby="caregiver-invitations-title">
    <div className="account-card-heading"><div><span className="micro-label">FAMILY ACCESS</span><h2 id="caregiver-invitations-title">Invite a caregiver</h2><p>Invite a trusted person to this adult or senior profile.</p></div><span className="account-card-icon"><UserPlus size={18} /></span></div>
    <p className="invitation-safety-note">The invitation expires in 7 days and works only for the invited, email-confirmed account. Share the link privately. Access starts only after the recipient signs in and accepts.</p>
    <form ref={formRef} action={action} className="invitation-create-form">
      <label htmlFor="caregiver-invite-email">Their email address</label><input id="caregiver-invite-email" name="email" type="email" maxLength={254} autoComplete="email" required />
      <label htmlFor="caregiver-invite-role">Relationship</label><select id="caregiver-invite-role" name="role" defaultValue="caregiver"><option value="caregiver">Caregiver</option><option value="family_member">Family member</option></select>
      <label className="invitation-write-option"><input type="checkbox" name="canWrite" /> Allow them to add and update care records</label>
      {state.message && <div className={`account-form-message ${state.status}`} role="status">{state.message}{state.invitationPath && <div className="invitation-share-row"><code>{state.invitationPath}</code><button type="button" onClick={async () => { await navigator.clipboard.writeText(new URL(state.invitationPath!, window.location.origin).toString()); setCopied(true); }}><Copy size={14} />{copied ? "Copied" : "Copy invite link"}</button></div>}</div>}
      <button className="account-record-link" type="submit" disabled={pending}>{pending ? "Creating link…" : "Create invite link"}</button>
    </form>
    <div className="invitation-list"><h3>People with profile access</h3>{relationships.length ? relationships.map((relationship) => <RelationshipRow key={relationship.id} patientId={patientId} relationship={relationship} />) : <p className="invitation-empty">No other active profile readers.</p>}</div>
    {loadError ? <p className="invitation-empty" role="status">Invitation history could not be loaded.</p> : <div className="invitation-list"><h3>Invitations</h3>{activeInvitations.length ? activeInvitations.map((invitation) => <InvitationRow key={invitation.id} patientId={patientId} invitation={invitation} />) : <p className="invitation-empty">No active invitations.</p>}</div>}
  </section>;
}

function RelationshipRow({ patientId, relationship }: { patientId: string; relationship: LinkedRelationship }) {
  const [state, action, pending] = useActionState(revokePatientRelationship.bind(null, patientId), initialState);
  return <article className="invitation-row"><div><strong>{relationship.relationship_role.replaceAll("_", " ")} · account ending {relationship.user_id.slice(-4)}</strong><span>{relationship.can_write ? "can add and update records" : "read only"}</span></div><form action={action}><input type="hidden" name="relationshipId" value={relationship.id} /><button type="submit" disabled={pending}>{pending ? "Removing…" : "Remove access"}</button>{state.message && <span className={`account-form-message ${state.status}`} role="status">{state.message}</span>}</form></article>;
}

function InvitationRow({ patientId, invitation }: { patientId: string; invitation: Invitation }) {
  const [state, action, pending] = useActionState(revokePatientInvitation.bind(null, patientId), initialState);
  return <article className="invitation-row"><div><strong>{invitation.invited_email}</strong><span>{invitation.relationship_role.replaceAll("_", " ")} · {invitation.can_write ? "can add and update records" : "read only"}</span><small>Expires {new Date(invitation.expires_at).toLocaleString()}</small></div><form action={action}><input type="hidden" name="invitationId" value={invitation.id} /><button type="submit" disabled={pending}>{pending ? "Revoking…" : "Revoke"}</button>{state.message && <span className={`account-form-message ${state.status}`} role="status">{state.message}</span>}</form></article>;
}
