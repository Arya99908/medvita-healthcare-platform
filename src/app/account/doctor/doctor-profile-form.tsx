"use client";

import { useActionState } from "react";
import { Check, Stethoscope } from "lucide-react";
import { saveDoctorProfile, type DoctorProfileState } from "./actions";

const initialState: DoctorProfileState = { status: "idle", message: "" };

export default function DoctorProfileForm({ profile }: { profile: { display_name: string; specialty: string | null; organisation: string | null; registration_number: string; issuing_jurisdiction: string } | null }) {
  const [state, action, pending] = useActionState(saveDoctorProfile, initialState);

  return <section className="account-card" aria-labelledby="doctor-profile-title">
    <div className="account-card-heading"><div><span className="micro-label">PROFESSIONAL PROFILE</span><h2 id="doctor-profile-title">Your details</h2><p>Registration details are private and visible only to you and platform administrators.</p></div><span className="account-card-icon"><Stethoscope size={18} /></span></div>
    <form action={action} className="account-profile-form">
      <label htmlFor="doctor-display-name">Name</label>
      <input id="doctor-display-name" name="displayName" autoComplete="name" minLength={2} maxLength={100} required defaultValue={profile?.display_name ?? ""} />
      <label htmlFor="doctor-specialty">Specialty <span>(optional)</span></label>
      <input id="doctor-specialty" name="specialty" maxLength={100} defaultValue={profile?.specialty ?? ""} />
      <label htmlFor="doctor-organisation">Clinic or organisation <span>(optional)</span></label>
      <input id="doctor-organisation" name="organisation" maxLength={120} defaultValue={profile?.organisation ?? ""} />
      <label htmlFor="doctor-registration-number">Professional registration number</label>
      <input id="doctor-registration-number" name="registrationNumber" minLength={2} maxLength={80} autoComplete="off" required defaultValue={profile?.registration_number ?? ""} />
      <label htmlFor="doctor-issuing-jurisdiction">Issuing council or jurisdiction</label>
      <input id="doctor-issuing-jurisdiction" name="issuingJurisdiction" minLength={2} maxLength={120} required defaultValue={profile?.issuing_jurisdiction ?? ""} />
      <p className="account-form-hint">Submitting starts a manual review. MedVita does not automatically check a professional registry.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}>{pending ? "Submitting…" : profile ? "Submit for review" : "Create and submit profile"}</button>
    </form>
  </section>;
}
