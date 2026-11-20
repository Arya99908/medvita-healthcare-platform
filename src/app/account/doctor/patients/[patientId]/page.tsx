import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, HeartPulse, Pill, ShieldCheck, Stethoscope } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { createClient } from "@/lib/supabase/server";
import ClinicalNoteForm from "../../clinical-note-form";
import AISummaryReviewForm from "../../ai-summary-review-form";
import { signOut } from "../../../actions";
import { patientSummarySchema } from "@/lib/ai/patient-summary";
import type { Json } from "@/lib/database.types";

const stageLabels: Record<string, string> = { infant: "Infant", child: "Child", adolescent: "Adolescent", adult: "Adult", senior: "Senior" };
const noteKindLabels: Record<string, string> = { consultation: "Consultation summary", treatment_plan: "Care plan note", follow_up: "Follow-up recommendation", addendum: "Correction or addendum" };

export default async function DoctorPatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patientId)) notFound();

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: doctor, error: doctorError }, { data: relationship, error: relationshipError }, { data: patient, error: patientError }, { data: permissions, error: permissionsError }] = await Promise.all([
    supabase.from("doctors").select("id,display_name,verification_status").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("patient_relationships").select("relationship_role,status,can_read").eq("patient_id", patientId).eq("user_id", user.id).maybeSingle(),
    supabase.from("patient_profiles").select("id,display_name,life_stage,date_of_birth").eq("id", patientId).maybeSingle(),
    supabase.from("access_permissions").select("permission,expires_at,revoked_at").eq("patient_id", patientId).eq("user_id", user.id).in("permission", ["read", "clinical_notes"]),
  ]);
  if (doctorError || relationshipError || patientError || permissionsError || !patient
    || doctor?.verification_status !== "verified" || relationship?.relationship_role !== "doctor"
    || relationship.status !== "active" || !relationship.can_read) notFound();

  const canAppendNotes = (permissions ?? []).some((permission) => permission.permission === "clinical_notes" && !permission.revoked_at);
  const [{ data: events, error: eventsError }, { data: symptoms, error: symptomsError }, { data: medications, error: medicationsError }, { data: appointments, error: appointmentsError }, { data: documents, error: documentsError }, { data: notes, error: notesError }, { data: aiReports, error: aiReportsError }] = await Promise.all([
    supabase.from("health_events").select("id,event_type,title,description,source,verification_status,occurred_at").eq("patient_id", patientId).eq("visibility", "general").order("occurred_at", { ascending: false }).limit(20),
    supabase.from("symptom_observations").select("id,symptom,severity,notes,observed_at").eq("patient_id", patientId).eq("visibility", "general").order("observed_at", { ascending: false }).limit(20),
    supabase.from("medication_records").select("id,medicine_name,generic_name,strength,route,instructions,status,created_at").eq("patient_id", patientId).eq("visibility", "general").order("created_at", { ascending: false }).limit(50),
    supabase.from("appointments").select("id,event_type,title,starts_at,location,status").eq("patient_id", patientId).eq("visibility", "general").order("starts_at", { ascending: false }).limit(20),
    supabase.from("medical_documents").select("id,display_name,document_type,document_date,storage_path,visibility,created_at").eq("patient_id", patientId).eq("visibility", "general").order("created_at", { ascending: false }).limit(30),
    supabase.from("clinical_notes").select("id,doctor_user_id,note_kind,title,body,follow_up_on,amends_note_id,created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(100),
    supabase.from("ai_reports").select("id,created_at,date_range_start,date_range_end,report_json").eq("patient_id", patientId).eq("report_type", "patient_history_summary").eq("visibility", "general").order("created_at", { ascending: false }).limit(20),
  ]);
  const reportIds = (aiReports ?? []).map((report) => report.id);
  const [{ data: aiSources, error: aiSourcesError }, { data: aiReviews, error: aiReviewsError }] = reportIds.length ? await Promise.all([
    supabase.from("ai_analysis_sources").select("id,report_id,source_label,source_date").eq("patient_id", patientId).in("report_id", reportIds).order("source_date", { ascending: false }),
    supabase.from("ai_report_reviews").select("id,report_id,doctor_user_id,review_outcome,review_note,created_at").eq("patient_id", patientId).in("report_id", reportIds).order("created_at", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const documentRecords = await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("medical-documents").createSignedUrl(document.storage_path, 300, { download: document.display_name });
    return { ...document, downloadUrl: data?.signedUrl ?? null };
  }));
  const hasLoadError = Boolean(eventsError || symptomsError || medicationsError || appointmentsError || documentsError || notesError || aiReportsError || aiSourcesError || aiReviewsError);

  return <main className="account-page care-dashboard-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account/doctor" className="account-back-link"><ArrowLeft size={15} /> Doctor dashboard</Link><form action={signOut}><button type="submit" className="account-signout">Sign out</button></form></div></header>
    <div className="care-dashboard-content">
      <div className="account-welcome"><span className="micro-label">CONSENTED PATIENT VIEW</span><h1>{patient.display_name}</h1><p>{stageLabels[patient.life_stage] ?? "Patient"}{patient.date_of_birth ? ` · Born ${patient.date_of_birth}` : ""} · review only records available to your account.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Patient-entered and imported information is labelled as reported or unverified. Clinical notes and AI-summary reviews are separately labelled and authored by a verified clinician. A review does not alter the AI-generated content.</span></div>
      <div className="report-toolbar-actions"><Link className="account-record-link" href={`/account/patients/${patientId}/reports`}><FileText size={15} /> Open health report</Link></div>

      {canAppendNotes && <ClinicalNoteForm patientId={patientId} notes={(notes ?? []).map(({ id, title, created_at }) => ({ id, title, created_at }))} />}

      {hasLoadError ? null : <section className="account-card care-dashboard-card" aria-labelledby="doctor-ai-summaries-title"><div className="account-card-heading"><div><span className="micro-label">PATIENT-CONSENTED AI</span><h2 id="doctor-ai-summaries-title">AI health summaries</h2><p>Review the dated summary and source labels. AI output is not a clinical record or medical advice.</p></div><span className="account-card-icon"><ShieldCheck size={18} /></span></div>
        {aiReports?.length ? <div className="timeline-event-list">{aiReports.map((report) => {
          const parsed = patientSummarySchema.safeParse(report.report_json as Json);
          const sources = (aiSources ?? []).filter((source) => source.report_id === report.id);
          const reviews = (aiReviews ?? []).filter((review) => review.report_id === report.id);
          return <article className="timeline-event" key={report.id}><div className="timeline-event-heading"><span className="timeline-event-type">{reviews[0] ? `AI summary · clinician review: ${reviews[0].review_outcome.replaceAll("_", " ")}` : "AI-generated summary · not clinician reviewed"}</span><span>{report.date_range_start ?? ""}{report.date_range_end ? ` to ${report.date_range_end}` : ""}</span></div><LocalDateTime value={report.created_at} />
            {parsed.success ? <>
              <p>{parsed.data.summary}</p>
              {parsed.data.observations.length > 0 && <ul>{parsed.data.observations.map((item, index) => <li key={index}>{item.text}</li>)}</ul>}
              {parsed.data.questionsForClinician.length > 0 && <><strong>Questions listed for the care conversation</strong><ul>{parsed.data.questionsForClinician.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
            </> : <p>This stored AI summary could not be displayed.</p>}
            {sources.length > 0 && <details><summary>View {sources.length} source records</summary><ul>{sources.map((source) => <li key={source.id}>{source.source_label}{source.source_date ? ` · ${source.source_date.slice(0, 10)}` : ""}</li>)}</ul></details>}
            {reviews.length > 0 && <div className="medication-record-subsection"><h3>Previous clinician reviews</h3>{reviews.map((review) => <div className="timeline-event" key={review.id}><strong>{review.review_outcome.replaceAll("_", " ")}</strong><p>{review.review_note}</p><LocalDateTime value={review.created_at} /></div>)}</div>}
            {canAppendNotes && <AISummaryReviewForm patientId={patientId} reportId={report.id} />}
          </article>;
        })}</div> : <p className="care-log-empty">No patient-consented AI summaries have been saved.</p>}
      </section>}

      {hasLoadError ? <div className="account-card"><div className="account-empty-state"><ShieldCheck size={22} /><strong>Some patient information could not be loaded</strong><span>Refresh the page or sign in again. Available database access checks still apply.</span></div></div> : <>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-timeline-title"><div className="account-card-heading"><div><span className="micro-label">PATIENT RECORD</span><h2 id="doctor-timeline-title">Recent timeline</h2><p>Reported events are not independently verified.</p></div><span className="account-card-icon"><HeartPulse size={18} /></span></div>
          {events?.length ? <div className="timeline-event-list">{events.map((event) => <article className="timeline-event" key={event.id}><div className="timeline-event-heading"><span className="timeline-event-type">{event.event_type.replaceAll("_", " ")} · {event.source} · {event.verification_status}</span><LocalDateTime value={event.occurred_at} /></div><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}</article>)}</div> : <p className="care-log-empty">No general timeline entries.</p>}
        </section>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-symptoms-title"><div className="account-card-heading"><div><span className="micro-label">PATIENT REPORTS</span><h2 id="doctor-symptoms-title">Recent symptoms</h2><p>Self-reported observations, not a clinical assessment.</p></div><span className="account-card-icon"><HeartPulse size={18} /></span></div>
          {symptoms?.length ? <div className="timeline-event-list">{symptoms.map((symptom) => <article className="timeline-event" key={symptom.id}><div className="timeline-event-heading"><span className="timeline-event-type">Patient or caregiver report{symptom.severity ? ` · reported severity ${symptom.severity}/5` : ""}</span><LocalDateTime value={symptom.observed_at} /></div><h3>{symptom.symptom}</h3>{symptom.notes && <p>{symptom.notes}</p>}</article>)}</div> : <p className="care-log-empty">No general symptom observations.</p>}
        </section>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-medications-title"><div className="account-card-heading"><div><span className="micro-label">MEDICINE NOTES</span><h2 id="doctor-medications-title">Medication list</h2><p>Patient-entered medication records may be incomplete or outdated.</p></div><span className="account-card-icon"><Pill size={18} /></span></div>
          {medications?.length ? <div className="timeline-event-list">{medications.map((medication) => <article className="timeline-event" key={medication.id}><div className="timeline-event-heading"><span className="timeline-event-type">{medication.status.replaceAll("_", " ")} · patient record</span><LocalDateTime value={medication.created_at} /></div><h3>{medication.medicine_name}</h3>{medication.generic_name && <p>Generic name: {medication.generic_name}</p>}{medication.strength && <p>Recorded strength: {medication.strength}</p>}{medication.route && <p>Recorded route: {medication.route}</p>}{medication.instructions && <p>Recorded instructions: {medication.instructions}</p>}</article>)}</div> : <p className="care-log-empty">No general medication records.</p>}
        </section>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-appointments-title"><div className="account-card-heading"><div><span className="micro-label">APPOINTMENTS</span><h2 id="doctor-appointments-title">Appointment history</h2><p>Appointments shown here were entered in MedVita.</p></div><span className="account-card-icon"><CalendarDays size={18} /></span></div>
          {appointments?.length ? <div className="timeline-event-list">{appointments.map((appointment) => <article className="timeline-event" key={appointment.id}><div className="timeline-event-heading"><span className="timeline-event-type">{appointment.event_type.replaceAll("_", " ")} · {appointment.status}</span><LocalDateTime value={appointment.starts_at} /></div><h3>{appointment.title}</h3>{appointment.location && <p>{appointment.location}</p>}</article>)}</div> : <p className="care-log-empty">No general appointments.</p>}
        </section>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-documents-title"><div className="account-card-heading"><div><span className="micro-label">PATIENT UPLOADS</span><h2 id="doctor-documents-title">Uploaded reports and documents</h2><p>Private files use short-lived download links.</p></div><span className="account-card-icon"><FileText size={18} /></span></div>
          {documentRecords.length ? <div className="timeline-event-list">{documentRecords.map((document) => <article className="timeline-event" key={document.id}><div className="timeline-event-heading"><span className="timeline-event-type">{document.document_type.replaceAll("_", " ")} · {document.visibility}</span><LocalDateTime value={document.created_at} /></div><h3>{document.display_name}</h3>{document.document_date && <p>Document date: {document.document_date}</p>}{document.downloadUrl && <a className="account-record-link" href={document.downloadUrl} rel="noreferrer">Download document</a>}</article>)}</div> : <p className="care-log-empty">No general uploads.</p>}
        </section>
        <section className="account-card care-dashboard-card" aria-labelledby="doctor-notes-title"><div className="account-card-heading"><div><span className="micro-label">CLINICIAN-AUTHORED</span><h2 id="doctor-notes-title">Consultation notes and recommendations</h2><p>Append-only clinician entries are distinct from patient reports and AI-generated summaries.</p></div><span className="account-card-icon"><Stethoscope size={18} /></span></div>
          {notes?.length ? <div className="timeline-event-list">{notes.map((note) => <article className="timeline-event" key={note.id}><div className="timeline-event-heading"><span className="timeline-event-type">{noteKindLabels[note.note_kind] ?? "Clinician note"} · clinician-authored</span><LocalDateTime value={note.created_at} /></div><h3>{note.title}</h3><p>{note.body}</p>{note.follow_up_on && <p>Follow-up date: {note.follow_up_on}</p>}{note.amends_note_id && <p>Linked as an addendum to a previous note.</p>}</article>)}</div> : <p className="care-log-empty">No clinician-authored notes have been added.</p>}
        </section>
      </>}
    </div>
  </main>;
}
