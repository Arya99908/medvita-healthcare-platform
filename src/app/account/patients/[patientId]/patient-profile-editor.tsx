"use client";

import { useActionState } from "react";
import { Check, UserRoundPen } from "lucide-react";
import { updatePatientProfile, type PatientProfileFormState } from "@/app/account/actions";

const initialState: PatientProfileFormState = { status: "idle", message: "" };

export default function PatientProfileEditor({
  patientId,
  displayName,
  dateOfBirth,
  sexAtBirth,
}: {
  patientId: string;
  displayName: string;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
}) {
  const [state, action, pending] = useActionState(updatePatientProfile, initialState);

  return <details className="account-card account-entry-disclosure patient-profile-editor">
    <summary className="account-card-heading">
      <div><span className="micro-label">YOUR PROFILE</span><h2>Edit profile details</h2><p>Update the basic details saved for this patient.</p></div>
      <span className="account-card-icon"><UserRoundPen size={18} /></span>
    </summary>
    <form action={action} className="account-profile-form">
      <input type="hidden" name="patientId" value={patientId} />
      <label htmlFor="patient-display-name">Full name</label>
      <input id="patient-display-name" name="displayName" autoComplete="name" minLength={2} maxLength={100} required defaultValue={displayName} />

      <label htmlFor="patient-date-of-birth">Date of birth <span>(optional)</span></label>
      <input id="patient-date-of-birth" name="dateOfBirth" type="date" defaultValue={dateOfBirth ?? ""} />

      <label htmlFor="patient-sex-at-birth">Sex at birth <span>(optional)</span></label>
      <select id="patient-sex-at-birth" name="sexAtBirth" defaultValue={sexAtBirth ?? ""}>
        <option value="">Not shared</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="intersex">Intersex</option>
      </select>

      <p className="guardian-pending-note">These details are visible to people who have access to this profile. Only the patient account can edit them here.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile details"}</button>
    </form>
  </details>;
}
