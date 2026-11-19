import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Pill, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import HealthEventForm from "../timeline-form";
import AppointmentForm from "../appointment-form";
import MedicationForm from "../medication-form";
import MedicationStatusForm from "../medication-status-form";
import LocalDateTime from "@/components/local-date-time";

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
  const { data: appointments, error: appointmentsError } = canRead
    ? await supabase.from("appointments").select("id,title,starts_at,ends_at,location,status").eq("patient_id", patientId).order("starts_at", { ascending: true })
    : { data: [], error: null };
  const { data: medications, error: medicationsError } = canRead
    ? await supabase.from("medication_records").select("id,medicine_name,generic_name,strength,route,instructions,status,visibility,created_at").eq("patient_id", patientId).order("created_at", { ascending: false })
    : { data: [], error: null };

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Your profiles</Link><Link href="/" className="account-back-link">Presentation demo</Link></div></header>
    <div className="patient-timeline-layout">
      <div className="account-welcome"><span className="micro-label">{stageLabels[profile.life_stage] ?? "PATIENT"} TIMELINE</span><h1>{profile.display_name}</h1><p>Personal entries for this profile, subject to its current access permissions.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Use fictional data only. Entries are unverified personal notes, not diagnoses, prescriptions, or medical advice.</span></div>
      {canWrite && <HealthEventForm patientId={patientId} lifeStage={profile.life_stage} />}
      {canWrite && <AppointmentForm patientId={patientId} />}
      {canWrite && <MedicationForm patientId={patientId} lifeStage={profile.life_stage} />}
      {!canRead && <div className="account-empty-state timeline-access-state"><Clock3 size={22} /><strong>Access is not active</strong><span>This profile has no active record permission for your account. A pending guardian request does not grant access.</span></div>}
      {canRead && <section className="account-card" aria-labelledby="medication-list-title"><div className="account-card-heading"><div><span className="micro-label">MEDICINE NOTES</span><h2 id="medication-list-title">Medicines</h2><p>Self-reported entries are not prescriptions or dose guidance.</p></div><span className="account-card-icon"><Pill size={18} /></span></div>
        {medicationsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Medicine notes could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : medications?.length ? <div className="timeline-event-list">{medications.map((medication) => <article key={medication.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{medication.status === "active" ? "Listed as current" : medication.status === "historical" ? "Past or stopped" : medication.status}</span><span className="timeline-verification">Unverified note</span></div><h3>{medication.medicine_name}</h3>{medication.generic_name && <p>Generic name: {medication.generic_name}</p>}{medication.strength && <p>Strength: {medication.strength}</p>}{medication.route && <p>How it is taken: {medication.route}</p>}{medication.instructions && <p>Recorded directions: {medication.instructions}</p>}{canWrite && <MedicationStatusForm patientId={patientId} medicationId={medication.id} status={medication.status} />}</article>)}</div>
            : <div className="account-empty-state"><Pill size={22} /><strong>No medicine notes saved</strong><span>Add a self-reported note if this profile&apos;s active access allows writing.</span></div>}
      </section>}
      {canRead && <section className="account-card" aria-labelledby="appointments-title"><div className="account-card-heading"><div><span className="micro-label">CARE CALENDAR</span><h2 id="appointments-title">Appointments</h2><p>Saved plans are not sent to clinics or external calendars.</p></div><span className="account-card-icon"><CalendarDays size={18} /></span></div>
        {appointmentsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Appointments could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : appointments?.length ? <div className="timeline-event-list">{appointments.map((appointment) => <article key={appointment.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{appointment.status}</span><LocalDateTime value={appointment.starts_at} /></div><h3>{appointment.title}</h3>{appointment.ends_at && <p>Ends <LocalDateTime value={appointment.ends_at} /></p>}{appointment.location && <p>{appointment.location}</p>}</article>)}</div>
            : <div className="account-empty-state"><CalendarDays size={22} /><strong>No appointments saved</strong><span>Appointments you enter here remain private to this profile’s access group.</span></div>}
      </section>}
      {canRead && <section className="account-card" aria-labelledby="timeline-title"><div className="account-card-heading"><div><span className="micro-label">RECORDS VISIBLE TO YOU</span><h2 id="timeline-title">Timeline entries</h2><p>Unverified entries stay clearly labeled.</p></div><span className="account-card-icon"><Clock3 size={18} /></span></div>
        {eventsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Timeline could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : events?.length ? <div className="timeline-event-list">{events.map((event) => <article key={event.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{event.event_type.replaceAll("_", " ")}</span><LocalDateTime value={event.occurred_at} /></div><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}<span className={`timeline-verification ${event.verification_status}`}>{event.verification_status === "verified" ? "Verified" : event.verification_status === "rejected" ? "Rejected" : "Unverified entry"}</span></article>)}</div>
            : <div className="account-empty-state"><Clock3 size={22} /><strong>No timeline entries</strong><span>When you add a note, it will appear here for people allowed to view it.</span></div>}
      </section>}
    </div>
  </main>;
}
