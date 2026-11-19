"use client";

import { useActionState, useState } from "react";
import { Check, Plus } from "lucide-react";
import { createPatientProfile, type PatientProfileFormState } from "@/app/account/actions";

const initialState: PatientProfileFormState = { status: "idle", message: "" };

export default function PatientProfileForm() {
  const [state, action, pending] = useActionState(createPatientProfile, initialState);
  const [lifeStage, setLifeStage] = useState("adult");
  const isMinorStage = ["infant", "child", "adolescent"].includes(lifeStage);

  return <section className="account-card" aria-labelledby="create-profile-title">
    <div className="account-card-heading"><div><span className="micro-label">PRIVATE HEALTH SPACE</span><h2 id="create-profile-title">Add a patient profile</h2><p>Only a few details to get started.</p></div><span className="account-card-icon"><Plus size={18} /></span></div>
    <form action={action} className="account-profile-form">
      <label htmlFor="displayName">Full name</label>
      <input id="displayName" name="displayName" autoComplete="name" minLength={2} maxLength={100} required placeholder="Enter the person's name" />

      <label htmlFor="lifeStage">Life stage</label>
      <select id="lifeStage" name="lifeStage" value={lifeStage} onChange={(event) => setLifeStage(event.target.value)} required>
        <option value="infant">Infant</option>
        <option value="child">Child</option>
        <option value="adolescent">Adolescent</option>
        <option value="adult">Adult</option>
        <option value="senior">Senior</option>
      </select>

      <label htmlFor="dateOfBirth">Date of birth <span>(optional)</span></label>
      <input id="dateOfBirth" name="dateOfBirth" type="date" />

      {isMinorStage && <label className="guardian-attestation"><input name="guardianAttestation" type="checkbox" required /><span>I am requesting this profile as the child&apos;s parent or legal guardian.</span></label>}
      {isMinorStage && <p className="guardian-pending-note">A minor profile stays pending review. This request does not grant access to health records.</p>}
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save profile"}</button>
    </form>
  </section>;
}
