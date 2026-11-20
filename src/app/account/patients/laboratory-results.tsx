"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, FlaskConical, Plus } from "lucide-react";
import { createLaboratoryResult, type CareLogFormState } from "./actions";

type Result = { id: string; test_name: string; value_text: string | null; unit: string | null; reference_range: string | null; result_date: string | null; document_id: string | null; verification_status: string; visibility: string };
type ReportDocument = { id: string; display_name: string; visibility: string; document_type: string };
const initialState: CareLogFormState = { status: "idle", message: "" };

export default function LaboratoryResults({ patientId, lifeStage, results, documents, canWrite, loadError }: {
  patientId: string;
  lifeStage: string;
  results: Result[];
  documents: ReportDocument[];
  canWrite: boolean;
  loadError: boolean;
}) {
  const isAdolescent = lifeStage === "adolescent";
  const [state, action, pending] = useActionState(createLaboratoryResult.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <section className="account-card" aria-labelledby="lab-results-title">
    <div className="account-card-heading"><div><span className="micro-label">TEST HISTORY</span><h2 id="lab-results-title">Laboratory results</h2><p>Enter values and ranges as shown on the report. MedVita does not flag or interpret them.</p></div><span className="account-card-icon"><FlaskConical size={18} /></span></div>
    {loadError ? <div className="account-empty-state"><FlaskConical size={22} /><strong>Test results could not be loaded</strong><span>Reload the page or sign in again.</span></div> : <>
      {results.length ? <div className="timeline-event-list">{results.map((result) => <article className="timeline-event" key={result.id}>
        <div className="timeline-event-heading"><span className="timeline-event-type">{result.verification_status} · {result.visibility === "sensitive_adolescent" ? "private" : "profile"} report</span>{result.result_date ? <time dateTime={result.result_date}>{result.result_date}</time> : <span className="timeline-verification">Report date not recorded</span>}</div>
        <h3>{result.test_name}</h3>
        <p>Result entered: {result.value_text ?? "Not recorded"}{result.unit ? ` ${result.unit}` : ""}</p>
        {result.reference_range && <p>Reference range entered: {result.reference_range}</p>}
        {result.document_id && <span className="timeline-verification">Report file: {documents.find((document) => document.id === result.document_id)?.display_name ?? "Linked private file"}</span>}
      </article>)}</div> : <div className="account-empty-state"><FlaskConical size={22} /><strong>No results saved</strong><span>Patient or caregiver entries appear here when available to this profile.</span></div>}
      {canWrite && <details className="account-entry-disclosure laboratory-result-form-disclosure"><summary>Add a laboratory result</summary><form ref={formRef} action={action} className="account-profile-form timeline-form">
        <label htmlFor="lab-test-name">Test name</label><input id="lab-test-name" name="testName" minLength={2} maxLength={120} required placeholder="As shown on the report" />
        <label htmlFor="lab-result-value">Result</label><input id="lab-result-value" name="valueText" minLength={1} maxLength={160} required placeholder="Enter the printed value or wording" />
        <label htmlFor="lab-result-unit">Unit <span>(optional)</span></label><input id="lab-result-unit" name="unit" maxLength={40} />
        <label htmlFor="lab-reference-range">Reference range <span>(optional)</span></label><input id="lab-reference-range" name="referenceRange" maxLength={120} placeholder="Copy the report's range if present" />
        <label htmlFor="lab-result-date">Report date <span>(optional)</span></label><input id="lab-result-date" name="resultDate" type="date" />
        <label htmlFor="lab-report-document">Uploaded test report <span>(optional; privacy must match)</span></label><select id="lab-report-document" name="documentId" defaultValue=""><option value="">No file linked</option>{documents.filter((document) => document.document_type === "test_result" && (isAdolescent || document.visibility === "general")).map((document) => <option key={document.id} value={document.id}>{document.display_name}{document.visibility === "sensitive_adolescent" ? " · private" : ""}</option>)}</select>
        {isAdolescent ? <><label htmlFor="lab-result-visibility">Privacy</label><select id="lab-result-visibility" name="visibility" defaultValue="general"><option value="general">General profile result</option><option value="sensitive_adolescent">Sensitive adolescent result</option></select></> : <input type="hidden" name="visibility" value="general" />}
        <p className="timeline-privacy-note">Use fictional data while clinical review is incomplete. The entered value and reference range are not medical advice.</p>
        {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save test result"}</button>
      </form></details>}
    </>}
  </section>;
}
