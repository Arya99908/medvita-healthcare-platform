import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, ArrowLeft, CalendarDays, ClipboardList, Clock3, FileText, Heart, Pill, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import HealthEventForm from "../timeline-form";
import AppointmentForm from "../appointment-form";
import AppointmentStatusForm from "../appointment-status-form";
import MedicationForm from "../medication-form";
import MedicationStatusForm from "../medication-status-form";
import DocumentForm from "../document-form";
import SymptomForm from "../symptom-form";
import ChildCareForms from "../child-care-forms";
import VitalForm from "../vital-form";
import MenstrualJournalForm from "../menstrual-journal-form";
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
    supabase.from("patient_relationships").select("relationship_role,status,can_read,can_write").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || relationshipError || !profile) notFound();

  const canRead = relationship?.status === "active" && relationship.can_read;
  const canWrite = canRead && relationship.can_write;
  const { data: events, error: eventsError } = canRead
    ? await supabase.from("health_events").select("id,event_type,title,description,occurred_at,verification_status,visibility").eq("patient_id", patientId).order("occurred_at", { ascending: false })
    : { data: [], error: null };
  const { data: symptoms, error: symptomsError } = canRead
    ? await supabase.from("symptom_observations").select("id,symptom,severity,notes,observed_at,visibility").eq("patient_id", patientId).order("observed_at", { ascending: false })
    : { data: [], error: null };
  const isChildStage = ["infant", "child"].includes(profile.life_stage);
  const isAdultStage = ["adult", "senior"].includes(profile.life_stage);
  const isAdolescentStage = profile.life_stage === "adolescent";
  const [{ data: feedings, error: feedingsError }, { data: bowelRecords, error: bowelRecordsError }, { data: vomitingRecords, error: vomitingRecordsError }, { data: growthRecords, error: growthRecordsError }, { data: urinationRecords, error: urinationRecordsError }, { data: sleepRecords, error: sleepRecordsError }] = canRead && isChildStage ? await Promise.all([
    supabase.from("feeding_records").select("id,feeding_type,quantity_ml,duration_minutes,notes,recorded_at").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(50),
    supabase.from("bowel_movement_records").select("id,consistency,color,notes,recorded_at").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(50),
    supabase.from("vomiting_records").select("id,count,associated_notes,recorded_at").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(50),
    supabase.from("growth_records").select("id,weight_kg,height_cm,head_circumference_cm,measured_at").eq("patient_id", patientId).order("measured_at", { ascending: false }).limit(50),
    supabase.from("urination_records").select("id,urination_type,count,volume_ml,notes,recorded_at,source,verification_status").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(50),
    supabase.from("sleep_records").select("id,sleep_type,started_at,ended_at,notes,source,verification_status").eq("patient_id", patientId).order("started_at", { ascending: false }).limit(50),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  const { data: vitals, error: vitalsError } = canRead && (isAdultStage || isChildStage)
    ? await supabase.from("vitals").select("id,vital_type,value,unit,source,verification_status,measured_at").eq("patient_id", patientId).order("measured_at", { ascending: false }).limit(100)
    : { data: [], error: null };
  const { data: menstrualRecords, error: menstrualRecordsError } = canRead && isAdolescentStage
    ? await supabase.from("menstrual_records").select("id,period_start,period_end,flow_note,symptom_note,created_at").eq("patient_id", patientId).order("period_start", { ascending: false }).limit(50)
    : { data: [], error: null };
  const { data: appointments, error: appointmentsError } = canRead
    ? await supabase.from("appointments").select("id,title,starts_at,ends_at,location,status").eq("patient_id", patientId).order("starts_at", { ascending: true })
    : { data: [], error: null };
  const { data: medications, error: medicationsError } = canRead
    ? await supabase.from("medication_records").select("id,medicine_name,generic_name,strength,route,instructions,status,visibility,created_at").eq("patient_id", patientId).order("created_at", { ascending: false })
    : { data: [], error: null };
  const { data: documents, error: documentsError } = canRead
    ? await supabase.from("medical_documents").select("id,display_name,document_type,document_date,storage_path,upload_status,verification_status,visibility,created_at").eq("patient_id", patientId).order("created_at", { ascending: false })
    : { data: [], error: null };
  const documentsWithLinks = await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("medical-documents").createSignedUrl(document.storage_path, 300, { download: document.display_name });
    return { ...document, downloadUrl: data?.signedUrl ?? null };
  }));

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Your profiles</Link><Link href="/" className="account-back-link">Presentation demo</Link></div></header>
    <div className="patient-timeline-layout">
      <div className="account-welcome"><span className="micro-label">{stageLabels[profile.life_stage] ?? "PATIENT"} TIMELINE</span><h1>{profile.display_name}</h1><p>Personal entries for this profile, subject to its current access permissions.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Use fictional data only. Entries are unverified personal notes, not diagnoses, prescriptions, or medical advice.</span></div>
      {canWrite && <HealthEventForm patientId={patientId} lifeStage={profile.life_stage} />}
      {canWrite && <SymptomForm patientId={patientId} lifeStage={profile.life_stage} />}
      {canWrite && isChildStage && <ChildCareForms patientId={patientId} />}
      {canWrite && (isAdultStage || isChildStage) && <VitalForm patientId={patientId} lifeStage={profile.life_stage} />}
      {canWrite && isAdolescentStage && relationship.relationship_role === "patient" && <MenstrualJournalForm patientId={patientId} />}
      {canWrite && <AppointmentForm patientId={patientId} />}
      {canWrite && <MedicationForm patientId={patientId} lifeStage={profile.life_stage} />}
      {canWrite && <DocumentForm patientId={patientId} lifeStage={profile.life_stage} />}
      {!canRead && <div className="account-empty-state timeline-access-state"><Clock3 size={22} /><strong>Access is not active</strong><span>This profile has no active record permission for your account. A pending guardian request does not grant access.</span></div>}
      {canRead && <section className="account-card" aria-labelledby="documents-title"><div className="account-card-heading"><div><span className="micro-label">PRIVATE FILES</span><h2 id="documents-title">Documents</h2><p>Files remain private. Download links expire after five minutes.</p></div><span className="account-card-icon"><FileText size={18} /></span></div>
        {documentsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Documents could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : documentsWithLinks.length ? <div className="timeline-event-list">{documentsWithLinks.map((document) => <article key={document.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{document.document_type.replaceAll("_", " ")}</span><span className="timeline-verification">{document.verification_status === "verified" ? "Verified" : "Unverified file"}</span></div><h3>{document.display_name}</h3>{document.document_date && <p>Document date: {document.document_date}</p>}{document.downloadUrl ? <a className="account-record-link" href={document.downloadUrl} rel="noreferrer">Download file</a> : <p>Download is unavailable; reload the page to try again.</p>}</article>)}</div>
            : <div className="account-empty-state"><FileText size={22} /><strong>No documents saved</strong><span>Only fictional files should be used in this prototype.</span></div>}
      </section>}
      {canRead && <section className="account-card" aria-labelledby="symptoms-title"><div className="account-card-heading"><div><span className="micro-label">SYMPTOM LOG</span><h2 id="symptoms-title">Observations</h2><p>Self-reported entries; severity is not a clinical assessment.</p></div><span className="account-card-icon"><Activity size={18} /></span></div>
        {symptomsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Observations could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : symptoms?.length ? <div className="timeline-event-list">{symptoms.map((observation) => <article key={observation.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">Severity {observation.severity} of 5 · unverified</span><LocalDateTime value={observation.observed_at} /></div><h3>{observation.symptom}</h3>{observation.notes && <p>{observation.notes}</p>}</article>)}</div>
            : <div className="account-empty-state"><Activity size={22} /><strong>No observations saved</strong><span>Self-reported entries appear here when available to this profile.</span></div>}
      </section>}
      {canRead && isAdolescentStage && <section className="account-card" aria-labelledby="private-cycle-title"><div className="account-card-heading"><div><span className="micro-label">SENSITIVE ADOLESCENT RECORD</span><h2 id="private-cycle-title">Private cycle notes</h2><p>Reads are filtered by explicit sensitive-record consent; only the adolescent account can add entries.</p></div><span className="account-card-icon"><Heart size={18} /></span></div>
        {menstrualRecordsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Private notes could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : menstrualRecords?.length ? <div className="timeline-event-list">{menstrualRecords.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">Private · unverified</span><time>{record.period_start}{record.period_end ? ` to ${record.period_end}` : " · end date not recorded"}</time></div>{record.flow_note && <p>Flow note: {record.flow_note}</p>}{record.symptom_note && <p>Personal note: {record.symptom_note}</p>}</article>)}</div>
            : <div className="account-empty-state"><Heart size={22} /><strong>No shared cycle notes</strong><span>This can mean no notes were saved or sensitive access has not been granted to this account.</span></div>}
      </section>}
      {canRead && isAdultStage && <section className="account-card" aria-labelledby="vitals-title"><div className="account-card-heading"><div><span className="micro-label">VITALS LOG</span><h2 id="vitals-title">Measurements</h2><p>Patient or caregiver reported; readings are not interpreted or verified here.</p></div><span className="account-card-icon"><Activity size={18} /></span></div>
        {vitalsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Readings could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : vitals?.length ? <div className="timeline-event-list">{vitals.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{record.vital_type.replaceAll("_", " ")} · {record.source} report · {record.verification_status}</span><LocalDateTime value={record.measured_at} /></div><h3>{record.value} {record.unit}</h3></article>)}</div>
            : <div className="account-empty-state"><Activity size={22} /><strong>No readings saved</strong><span>Measurements saved to this profile will appear here as unverified entries.</span></div>}
      </section>}
      {canRead && isChildStage && <section className="account-card" aria-labelledby="child-care-title"><div className="account-card-heading"><div><span className="micro-label">CHILD CARE LOGS</span><h2 id="child-care-title">Feeding and bowel notes</h2><p>Caregiver or patient entries are unverified and do not provide clinical guidance.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></div>
        {feedingsError || bowelRecordsError || vomitingRecordsError || growthRecordsError || urinationRecordsError || sleepRecordsError || vitalsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Care logs could not be loaded</strong><span>Reload the page or sign in again.</span></div> : <>
          <h3 className="care-log-subheading">Feeding</h3>{feedings?.length ? <div className="timeline-event-list">{feedings.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{record.feeding_type.replaceAll("_", " ")} · unverified</span><LocalDateTime value={record.recorded_at} /></div>{record.quantity_ml != null && <p>Recorded quantity: {record.quantity_ml} ml</p>}{record.duration_minutes != null && <p>Duration: {record.duration_minutes} minutes</p>}{record.notes && <p>{record.notes}</p>}</article>)}</div> : <p className="care-log-empty">No feeding entries saved.</p>}
          <h3 className="care-log-subheading">Bowel movements</h3>{bowelRecords?.length ? <div className="timeline-event-list">{bowelRecords.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">Unverified observation</span><LocalDateTime value={record.recorded_at} /></div>{record.consistency && <p>Consistency: {record.consistency}</p>}{record.color && <p>Colour: {record.color}</p>}{record.notes && <p>{record.notes}</p>}</article>)}</div> : <p className="care-log-empty">No bowel movement entries saved.</p>}
          <h3 className="care-log-subheading">Vomiting episodes</h3>{vomitingRecords?.length ? <div className="timeline-event-list">{vomitingRecords.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{record.count} {record.count === 1 ? "episode" : "episodes"} · unverified</span><LocalDateTime value={record.recorded_at} /></div>{record.associated_notes && <p>{record.associated_notes}</p>}</article>)}</div> : <p className="care-log-empty">No vomiting entries saved.</p>}
          <h3 className="care-log-subheading">Growth measurements</h3>{growthRecords?.length ? <div className="timeline-event-list">{growthRecords.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">Unverified measurement</span><LocalDateTime value={record.measured_at} /></div>{record.weight_kg != null && <p>Weight: {record.weight_kg} kg</p>}{record.height_cm != null && <p>Height or length: {record.height_cm} cm</p>}{record.head_circumference_cm != null && <p>Head circumference: {record.head_circumference_cm} cm</p>}</article>)}</div> : <p className="care-log-empty">No growth measurements saved.</p>}
          <h3 className="care-log-subheading">Wet diapers and urination</h3>{urinationRecords?.length ? <div className="timeline-event-list">{urinationRecords.map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{record.urination_type.replaceAll("_", " ")} · {record.source} · {record.verification_status}</span><LocalDateTime value={record.recorded_at} /></div><p>{record.count} {record.urination_type === "wet_diaper" ? (record.count === 1 ? "wet diaper" : "wet diapers") : (record.count === 1 ? "entry" : "entries")}</p>{record.volume_ml != null && <p>Recorded volume: {record.volume_ml} ml</p>}{record.notes && <p>{record.notes}</p>}</article>)}</div> : <p className="care-log-empty">No urination entries saved.</p>}
          <h3 className="care-log-subheading">Sleep periods</h3>{sleepRecords?.length ? <div className="timeline-event-list">{sleepRecords.map((record) => { const durationMinutes = Math.round((Date.parse(record.ended_at) - Date.parse(record.started_at)) / 60_000); return <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{record.sleep_type} · {record.source} · {record.verification_status}</span><LocalDateTime value={record.started_at} /></div><p>Ended <LocalDateTime value={record.ended_at} /> · recorded duration {Math.floor(durationMinutes / 60)} hr {durationMinutes % 60} min</p>{record.notes && <p>{record.notes}</p>}</article>; })}</div> : <p className="care-log-empty">No sleep periods saved.</p>}
          <h3 className="care-log-subheading">Temperature readings</h3>{vitals?.length ? <div className="timeline-event-list">{vitals.filter((record) => record.vital_type === "temperature").map((record) => <article key={record.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">Temperature · {record.source} report · {record.verification_status}</span><LocalDateTime value={record.measured_at} /></div><h3>{record.value} {record.unit}</h3></article>)}</div> : <p className="care-log-empty">No temperature readings saved.</p>}
        </>}
      </section>}
      {canRead && <section className="account-card" aria-labelledby="medication-list-title"><div className="account-card-heading"><div><span className="micro-label">MEDICINE NOTES</span><h2 id="medication-list-title">Medicines</h2><p>Self-reported entries are not prescriptions or dose guidance.</p></div><span className="account-card-icon"><Pill size={18} /></span></div>
        {medicationsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Medicine notes could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : medications?.length ? <div className="timeline-event-list">{medications.map((medication) => <article key={medication.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{medication.status === "active" ? "Listed as current" : medication.status === "historical" ? "Past or stopped" : medication.status}</span><span className="timeline-verification">Unverified note</span></div><h3>{medication.medicine_name}</h3>{medication.generic_name && <p>Generic name: {medication.generic_name}</p>}{medication.strength && <p>Strength: {medication.strength}</p>}{medication.route && <p>How it is taken: {medication.route}</p>}{medication.instructions && <p>Recorded directions: {medication.instructions}</p>}{canWrite && <MedicationStatusForm patientId={patientId} medicationId={medication.id} status={medication.status} />}</article>)}</div>
            : <div className="account-empty-state"><Pill size={22} /><strong>No medicine notes saved</strong><span>Add a self-reported note if this profile&apos;s active access allows writing.</span></div>}
      </section>}
      {canRead && <section className="account-card" aria-labelledby="appointments-title"><div className="account-card-heading"><div><span className="micro-label">CARE CALENDAR</span><h2 id="appointments-title">Appointments</h2><p>Saved plans are not sent to clinics or external calendars. Marking one canceled only changes this list.</p></div><span className="account-card-icon"><CalendarDays size={18} /></span></div>
        {appointmentsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Appointments could not be loaded</strong><span>Reload the page or sign in again.</span></div>
          : appointments?.length ? <div className="timeline-event-list">{appointments.map((appointment) => <article key={appointment.id} className="timeline-event"><div className="timeline-event-heading"><span className="timeline-event-type">{appointment.status.replaceAll("_", " ")}</span><LocalDateTime value={appointment.starts_at} /></div><h3>{appointment.title}</h3>{appointment.ends_at && <p>Ends <LocalDateTime value={appointment.ends_at} /></p>}{appointment.location && <p>{appointment.location}</p>}{canWrite && <AppointmentStatusForm patientId={patientId} appointmentId={appointment.id} status={appointment.status} />}</article>)}</div>
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
