import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Baby, CalendarDays, Check, ClipboardList, Clock3, Download, Heart, LogOut, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PatientProfileForm from "./profile-form";
import { signOut } from "./actions";

const stageLabels: Record<string, string> = { infant: "Infant", child: "Child", adolescent: "Adolescent", adult: "Adult", senior: "Senior" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: profiles, error: profilesError }, { data: relationships, error: relationshipsError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,display_name,date_of_birth,life_stage,created_at").order("created_at", { ascending: false }),
    supabase.from("patient_relationships").select("patient_id,relationship_role,status,can_read,can_write").eq("user_id", user.id),
  ]);
  const relationshipByPatient = new Map((relationships ?? []).map((relationship) => [relationship.patient_id, relationship]));
  const hasLoadError = Boolean(profilesError || relationshipsError);

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account/care" className="account-back-link"><ClipboardList size={15} /> Care tasks</Link><Link href="/account/calendar" className="account-back-link"><CalendarDays size={15} /> Calendar</Link><Link href="/" className="account-back-link"><ArrowLeft size={15} /> Presentation demo</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="account-layout">
      <div className="account-main-column">
        <div className="account-welcome"><span className="micro-label">YOUR PRIVATE HEALTH SPACE</span><h1>Patient profiles</h1><p>Manage your own profile and review any pending guardian requests.</p></div>
        <section className="account-card account-profiles" aria-labelledby="profiles-title"><div className="account-card-heading"><div><span className="micro-label">CONNECTED PROFILES</span><h2 id="profiles-title">Your profiles</h2><p>Access follows the relationship and consent recorded for each profile.</p></div><span className="account-card-icon"><Users size={18} /></span></div>
          {hasLoadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Profiles could not be loaded</strong><span>Refresh the page or sign in again. No account details were shown.</span></div>
            : profiles?.length ? <div className="account-profile-list">{profiles.map((profile) => {
              const relationship = relationshipByPatient.get(profile.id);
              const pendingGuardian = relationship?.relationship_role === "guardian" && relationship.status === "pending";
              const active = relationship?.status === "active";
              const canRead = active && Boolean(relationship.can_read);
              return <article className="account-profile-row" key={profile.id}><span className={`account-profile-avatar ${profile.life_stage === "infant" || profile.life_stage === "child" ? "child" : ""}`}>{profile.life_stage === "infant" ? <Baby size={18} /> : <Heart size={17} />}</span><div className="account-profile-copy"><strong>{profile.display_name}</strong><span>{stageLabels[profile.life_stage] ?? "Profile"}{profile.date_of_birth ? ` · Born ${new Date(`${profile.date_of_birth}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>{pendingGuardian && <small>Guardian request pending review. Record access is not active.</small>}</div><span className={`account-status ${pendingGuardian ? "pending" : active ? "active" : "inactive"}`}>{pendingGuardian ? <><Clock3 size={13} /> Pending review</> : active ? <><Check size={13} /> Active</> : "No active access"}</span>{canRead && <Link className="account-record-link" href={`/account/patients/${profile.id}`}>Open timeline</Link>}</article>;
            })}</div> : <div className="account-empty-state"><Heart size={23} /><strong>No profiles yet</strong><span>Create your own profile or submit a guardian request for a minor.</span></div>}
        </section>
        <div className="account-safety-note"><ShieldCheck size={17} /><span>Fictional presentation profiles are separate from these account records. Use test data until the access rules and care workflows have been reviewed.</span></div>
        <section className="account-export" aria-labelledby="export-title"><div><strong id="export-title">Your data</strong><span>Download the account data stored in MedVita. Browser-only demo notes and document files are not included.</span></div><Link href="/api/account/export"><Download size={16} /> Download a copy</Link></section>
      </div>
      <aside className="account-side-column"><PatientProfileForm /><div className="account-side-help"><span className="micro-label">NEED THE DEMO?</span><p>Switch between all six fictional life stages without an account.</p><Link href="/">Open presentation demo <ArrowLeft size={14} /></Link></div></aside>
    </div>
  </main>;
}
