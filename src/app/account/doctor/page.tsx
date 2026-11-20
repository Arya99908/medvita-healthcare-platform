import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardList, LogOut, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import DoctorProfileForm from "./doctor-profile-form";

const stageLabels: Record<string, string> = { infant: "Infant", child: "Child", adolescent: "Adolescent", adult: "Adult", senior: "Senior" };

export default async function DoctorDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: relationships, error: relationshipsError }, { data: permissions, error: permissionsError }] = await Promise.all([
    supabase.from("doctors").select("id,display_name,specialty,organisation,verification_status").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("patient_relationships").select("patient_id,status,can_read").eq("user_id", user.id).eq("relationship_role", "doctor").eq("status", "active").eq("can_read", true),
    supabase.from("access_permissions").select("patient_id,expires_at").eq("user_id", user.id).eq("permission", "read").is("revoked_at", null),
  ]);
  // Patient profile RLS applies the authoritative expiry check in has_patient_access.
  const permissionPatientIds = new Set((permissions ?? []).map((permission) => permission.patient_id));
  const authorizedPatientIds = [...new Set((relationships ?? []).map((relationship) => relationship.patient_id).filter((id) => permissionPatientIds.has(id)))];
  const { data: patients, error: patientsError } = authorizedPatientIds.length
    ? await supabase.from("patient_profiles").select("id,display_name,life_stage").in("id", authorizedPatientIds).order("display_name")
    : { data: [], error: null };
  const hasLoadError = Boolean(profileError || relationshipsError || permissionsError || patientsError);

  return <main className="account-page care-dashboard-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Profiles</Link><Link href="/account/calendar" className="account-back-link"><CalendarDays size={15} /> Calendar</Link><Link href="/account/care" className="account-back-link"><ClipboardList size={15} /> Care tasks</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="account-layout">
      <div className="account-main-column">
        <div className="account-welcome"><span className="micro-label">CLINICIAN SPACE</span><h1>Doctor dashboard</h1><p>{profile ? `Welcome, ${profile.display_name}.` : "Set up your professional profile to get started."} Review patient records only when access has been explicitly granted.</p></div>
        <div className="account-safety-note"><ShieldCheck size={17} /><span>This workspace is read-only. Patient information appears only when an active doctor relationship and unexpired read permission both exist. Sensitive adolescent records remain separately protected.</span></div>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-patients-title">
          <div className="account-card-heading"><div><span className="micro-label">CONSENTED ACCESS</span><h2 id="doctor-patients-title">Patient profiles</h2><p>Only profiles already linked to your account with read permission appear here.</p></div><span className="account-card-icon"><Users size={18} /></span></div>
          {hasLoadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Patient list could not be loaded</strong><span>Refresh the page or sign in again. No patient details were shown.</span></div>
            : patients?.length ? <div className="account-profile-list">{patients.map((patient) => <article className="account-profile-row" key={patient.id}><span className="account-profile-avatar"><Stethoscope size={17} /></span><div className="account-profile-copy"><strong>{patient.display_name}</strong><span>{stageLabels[patient.life_stage] ?? "Patient"}</span></div><Link className="account-record-link" href={`/account/patients/${patient.id}/reports`}>Open read-only report</Link></article>)}</div>
              : <div className="account-empty-state"><Users size={23} /><strong>No patient profiles are linked</strong><span>Patient or clinic-managed access requests are not available in this prototype. Searching for patient records is disabled.</span></div>}
        </section>
        {profile && <div className="account-status active">Profile status: {profile.verification_status.replaceAll("_", " ")}</div>}
      </div>
      <aside className="account-side-column"><DoctorProfileForm profile={profile ? { display_name: profile.display_name, specialty: profile.specialty, organisation: profile.organisation } : null} /><div className="account-side-help"><span className="micro-label">PATIENT DEMO</span><p>Switch between the six fictional life stages for a presentation.</p><Link href="/">Open presentation demo <ArrowLeft size={14} /></Link></div></aside>
    </div>
  </main>;
}
