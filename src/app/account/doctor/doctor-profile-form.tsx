"use client";

import { useActionState } from "react";
import { Check, Stethoscope } from "lucide-react";
import { saveDoctorProfile, type DoctorProfileState } from "./actions";

const initialState: DoctorProfileState = { status: "idle", message: "" };

export default function DoctorProfileForm({ profile }: { profile: { display_name: string; specialty: string | null; organisation: string | null } | null }) {
  const [state, action, pending] = useActionState(saveDoctorProfile, initialState);

  return <section className="account-card" aria-labelledby="doctor-profile-title">
    <div className="account-card-heading"><div><span className="micro-label">PROFESSIONAL PROFILE</span><h2 id="doctor-profile-title">Your details</h2><p>Profiles stay unverified until a clinic administrator reviews them.</p></div><span className="account-card-icon"><Stethoscope size={18} /></span></div>
    <form action={action} className="account-profile-form">
      <label htmlFor="doctor-display-name">Name</label>
      <input id="doctor-display-name" name="displayName" autoComplete="name" minLength={2} maxLength={100} required defaultValue={profile?.display_name ?? ""} />
      <label htmlFor="doctor-specialty">Specialty <span>(optional)</span></label>
      <input id="doctor-specialty" name="specialty" maxLength={100} defaultValue={profile?.specialty ?? ""} />
      <label htmlFor="doctor-organisation">Clinic or organisation <span>(optional)</span></label>
      <input id="doctor-organisation" name="organisation" maxLength={120} defaultValue={profile?.organisation ?? ""} />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}>{pending ? "Saving…" : profile ? "Save details" : "Create professional profile"}</button>
    </form>
  </section>;
}
