"use client";

import { useActionState } from "react";
import { Bot, FileText, ShieldCheck } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import type { Json } from "@/lib/database.types";
import { generatePatientAISummary, type PatientSummaryState } from "./patient-ai-summary-action";

type StoredReport = {
  id: string;
  created_at: string;
  date_range_start: string | null;
  date_range_end: string | null;
  report_json: Json;
  review_status: string;
  sources: Array<{ id: string; source_label: string; source_date: string | null }>;
  reviews: Array<{ id: string; review_outcome: string; review_note: string; created_at: string }>;
};

const initialState: PatientSummaryState = { status: "idle", message: "" };

function parseReport(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const report = value as Record<string, Json>;
  const summary = typeof report.summary === "string" ? report.summary : null;
  const observations = Array.isArray(report.observations) ? report.observations.filter((item) => item && typeof item === "object" && !Array.isArray(item)) as Array<Record<string, Json>> : [];
  const questions = Array.isArray(report.questionsForClinician) ? report.questionsForClinician.filter((item): item is string => typeof item === "string") : [];
  const missing = Array.isArray(report.missingInformation) ? report.missingInformation.filter((item): item is string => typeof item === "string") : [];
  return summary ? { summary, observations: observations.map((item) => ({ text: typeof item.text === "string" ? item.text : "", sourceIds: Array.isArray(item.sourceIds) ? item.sourceIds.filter((id): id is string => typeof id === "string") : [] })), questions, missing } : null;
}

export default function PatientAISummary({ patientId, enabled, reports, loadError }: { patientId: string; enabled: boolean; reports: StoredReport[]; loadError: boolean }) {
  const [state, action, pending] = useActionState(generatePatientAISummary, initialState);
  return <section className="account-card" aria-labelledby="patient-ai-summary-title">
    <div className="account-card-heading"><div><span className="micro-label">AI HEALTH SUMMARY</span><h2 id="patient-ai-summary-title">Prepare for a care conversation</h2><p>Summarize selected general records and keep the dated result with this profile.</p></div><span className="account-card-icon"><Bot size={18} /></span></div>
    {enabled ? <form action={action} className="account-profile-form timeline-form">
      <input type="hidden" name="patientId" value={patientId} />
      <label htmlFor="patient-ai-range">Records to include</label>
      <select id="patient-ai-range" name="rangeDays" defaultValue="90"><option value="30">Past 30 days</option><option value="90">Past 90 days</option><option value="365">Past 12 months</option></select>
      <label className="invitation-write-option"><input name="aiConsent" type="checkbox" required /> I agree to send the selected general health records to MedVita’s configured AI service for this one-time summary.</label>
      <p className="timeline-privacy-note">Only the patient account can request this. Sensitive adolescent entries and uploaded document contents are excluded. You can cancel before sending. The summary does not diagnose, assess urgency, or recommend treatment.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Bot size={16} />{pending ? "Preparing summary…" : "Create AI summary"}</button>
      {state.status === "success" && state.report && <SummaryResult report={state.report} sources={state.sources ?? []} createdAt={state.createdAt} />}
    </form> : <div className="account-empty-state"><ShieldCheck size={22} /><strong>Patient account required</strong><span>AI processing is available only when the patient is signed in and explicitly consents for a single request.</span></div>}
    {loadError && <p className="account-form-message error" role="status">Saved summaries or their source links could not be loaded.</p>}
    {reports.length > 0 && <div className="timeline-event-list"><h3>Saved summaries</h3>{reports.map((item) => {
      const parsed = parseReport(item.report_json);
      const latestReview = item.reviews[0];
      const statusLabel = latestReview
        ? `Clinician review: ${latestReview.review_outcome.replaceAll("_", " ")}`
        : item.review_status === "reviewed" ? "Clinician reviewed" : "AI-generated · not clinician reviewed";
      return <article className="timeline-event" key={item.id}><div className="timeline-event-heading"><span className="timeline-event-type">{statusLabel}</span><LocalDateTime value={item.created_at} /></div>{item.date_range_start && item.date_range_end && <p>Records from {item.date_range_start} to {item.date_range_end}</p>}{parsed ? <><p>{parsed.summary}</p><ul>{parsed.observations.map((observation, index) => <li key={`${item.id}-observation-${index}`}>{observation.text}</li>)}</ul>{parsed.questions.length > 0 && <><strong>Questions to discuss with a clinician</strong><ul>{parsed.questions.map((question, index) => <li key={`${item.id}-question-${index}`}>{question}</li>)}</ul></>}{parsed.missing.length > 0 && <><strong>Information not present in this record set</strong><ul>{parsed.missing.map((entry, index) => <li key={`${item.id}-missing-${index}`}>{entry}</li>)}</ul></>}{item.sources.length > 0 && <details><summary><FileText size={14} /> View {item.sources.length} source records</summary><ul>{item.sources.map((source) => <li key={source.id}>{source.source_label}{source.source_date ? ` · ${source.source_date.slice(0, 10)}` : ""}</li>)}</ul></details>}</> : <p>This saved summary could not be displayed.</p>}{item.reviews.length > 0 && <div className="medication-record-subsection"><h3>Clinician review history</h3>{item.reviews.map((review) => <div className="timeline-event" key={review.id}><div className="timeline-event-heading"><strong>{review.review_outcome.replaceAll("_", " ")}</strong><LocalDateTime value={review.created_at} /></div><p>{review.review_note}</p></div>)}</div>}<p className="timeline-privacy-note">AI output can be incomplete or wrong. Review it with a qualified clinician; it is not medical advice.</p></article>;
    })}</div>}
  </section>;
}

function SummaryResult({ report, sources, createdAt }: { report: NonNullable<PatientSummaryState["report"]>; sources: NonNullable<PatientSummaryState["sources"]>; createdAt?: string }) {
  return <article className="ai-summary-result" aria-live="polite"><span className="coming-label">AI-GENERATED · NOT CLINICIAN REVIEWED</span>{createdAt && <LocalDateTime value={createdAt} />}<p>{report.summary}</p>{report.observations.length > 0 && <ul>{report.observations.map((observation, index) => { const cited = sources.filter((source) => observation.sourceIds.includes(source.id)); return <li key={index}>{observation.text}{cited.length > 0 && <small> Sources: {cited.map((source) => source.label).join("; ")}</small>}</li>; })}</ul>}{report.questionsForClinician.length > 0 && <><strong>Questions to discuss with a clinician</strong><ul>{report.questionsForClinician.map((question, index) => <li key={index}>{question}</li>)}</ul></>}{report.missingInformation.length > 0 && <><strong>Information not present in this record set</strong><ul>{report.missingInformation.map((item, index) => <li key={index}>{item}</li>)}</ul></>}<p className="timeline-privacy-note">This is not a diagnosis or treatment recommendation. Review the source records and discuss this summary with a qualified clinician.</p></article>;
}
