import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import HealthEventForm from "../timeline-form";

const stageLabels: Record<string, string> = { infant: "Infant", child: "Child", adolescent: "Adolescent", adult: "Adult", senior: "Senior" };

export default async function PatientTimelinePage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patientId)) notFound();

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: relationship, error: relationshipError }] = await Promise.all([
    supabase.from("patient_profiles").select("id,display_name,life_stage").eq("id", patientId).maybeSingle(),
    supabase.from("patient_relationships").select("status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile) notFound();

  const canRead = relationship?.status === "active" && relationship.can_read;
  const canWrite = canRead && relationship.can_write;
  const { data: events, error: eventsError } = canRead
    ? await supabase.from("health_events").select("id,event_type,title,description,occurred_at,verification_status,visibility").eq("patient_id", patientId).order("occurred_at", { ascending: false })
    : { data: [], error: null };

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Your profiles</Link><Link href="/" className="account-back-link">Presentation demo</Link></div></header>
    <div className="patient-timeline-layout">
      <div className="account-welcome"><span className="micro-label">{stageLabels[profile.life_stage] ?? "PATIENT"} TIMELINE</span><h1>{profile.display_name}</h1><p>Personal entries for this profile, subject to its current access permissions.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Use fictional data only. Entries are unverified personal notes, not diagnoses, prescriptions, or medical advice.</span></div>
      {canWrite && <HealthEventForm patientId={patientId} lifeStage={profile.life_stage} />}
      {!canRead && <div className="account-empty-state timeline-access-state"><Clock3 size={22} /><strong>Access is not active</strong><span>This profile has no active record permission for your account. A pending guardian request does not grant access.</span></div>}
      {canRead && <section className="account-card" aria-labelledby="timeline-title"><div className="account-card-heading"><div><span className="micro-label">RECORDS VISIBLE TO YOU</span><h2 id="timeline-title">Timeline entries</h2><p>Unverified entries stay clearly labeled.</p></div><span className="account-card-icon"><Clock3 size={18} /></span></div>
        {eventsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Timeline could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : events?.length ? <div className="timeline-event-list">{events.map((event) => <article key={event.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{event.event_type.replaceAll("_", " ")}</span><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}<span className={`timeline-verification ${event.verification_status}`}>{event.verification_status === "verified" ? "Verified" : event.verification_status === "rejected" ? "Rejected" : "Unverified entry"}</span></article>)}</div>
            : <div className="account-empty-state"><Clock3 size={22} /><strong>No timeline entries</strong><span>When you add a note, it will appear here for people allowed to view it.</span></div>}
      </section>}
    </div>
  </main>;
}
