"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { Building2, Check, Plus } from "lucide-react";
import { createHospitalAdmission, createHospitalVisit, type CareLogFormState } from "./actions";

type Visit = { id: string; visit_date: string; visit_type: string | null; facility_name: string | null; provider_name: string | null; notes: string | null; visibility: string };
type Admission = { id: string; admitted_at: string; discharged_at: string | null; facility_name: string | null; summary: string | null; discharge_document_id: string | null; visibility: string };
type DischargeDocument = { id: string; display_name: string; visibility: string };

const initialState: CareLogFormState = { status: "idle", message: "" };

function setTimezoneOffset(event: ChangeEvent<HTMLInputElement>, name: string) {
  const field = event.currentTarget.form?.elements.namedItem(name);
  if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function HospitalHistory({ patientId, lifeStage, visits, admissions, documents, canWrite, loadError }: {
  patientId: string;
  lifeStage: string;
  visits: Visit[];
  admissions: Admission[];
  documents: DischargeDocument[];
  canWrite: boolean;
  loadError: boolean;
}) {
  const isAdolescent = lifeStage === "adolescent";
  const visitAction = createHospitalVisit.bind(null, patientId);
  const admissionAction = createHospitalAdmission.bind(null, patientId);
  const [visitState, submitVisit, visitPending] = useActionState(visitAction, initialState);
  const [admissionState, submitAdmission, admissionPending] = useActionState(admissionAction, initialState);
  const visitForm = useRef<HTMLFormElement>(null);
  const admissionForm = useRef<HTMLFormElement>(null);

  useEffect(() => { if (visitState.status === "success") visitForm.current?.reset(); }, [visitState]);
  useEffect(() => { if (admissionState.status === "success") admissionForm.current?.reset(); }, [admissionState]);

  return <section className="account-card" aria-labelledby="hospital-history-title">
    <div className="account-card-heading"><div><span className="micro-label">CARE HISTORY</span><h2 id="hospital-history-title">Visits and hospital stays</h2><p>Patient or caregiver reports. Names and notes are not independently verified. Use fictional data while clinical review is incomplete.</p></div><span className="account-card-icon"><Building2 size={18} /></span></div>
    {loadError ? <div className="account-empty-state"><Building2 size={22} /><strong>Hospital history could not be loaded</strong><span>Reload the page or sign in again.</span></div> : <>
      {admissions.length || visits.length ? <div className="timeline-event-list">
        {admissions.map((item) => <article className="timeline-event" key={`admission-${item.id}`}>
          <div className="timeline-event-heading"><span className="timeline-event-type">Hospital admission · {item.visibility === "sensitive_adolescent" ? "private · " : ""}unverified</span><time dateTime={item.admitted_at}>{dateLabel(item.admitted_at)}</time></div>
          <h3>{item.facility_name || "Facility not recorded"}</h3>
          {item.discharged_at ? <p>Discharged {dateLabel(item.discharged_at)}</p> : <p>Discharge date not recorded</p>}
          {item.summary && <p>{item.summary}</p>}
          {item.discharge_document_id && <span className="timeline-verification">Discharge document: {documents.find((document) => document.id === item.discharge_document_id)?.display_name ?? "Linked private file"}</span>}
        </article>)}
        {visits.map((item) => <article className="timeline-event" key={`visit-${item.id}`}>
          <div className="timeline-event-heading"><span className="timeline-event-type">{(item.visit_type ?? "visit").replaceAll("_", " ")} · {item.visibility === "sensitive_adolescent" ? "private · " : ""}unverified</span><time dateTime={item.visit_date}>{dateLabel(item.visit_date)}</time></div>
          <h3>{item.facility_name || "Facility not recorded"}</h3>
          {item.provider_name && <p>Clinician entered: {item.provider_name}</p>}
          {item.notes && <p>{item.notes}</p>}
        </article>)}
      </div> : <div className="account-empty-state"><Building2 size={22} /><strong>No visits or hospital stays recorded</strong><span>Records entered for this profile will appear here.</span></div>}
      {canWrite && <div className="hospital-history-entry-grid">
        <details className="account-entry-disclosure"><summary>Add a hospital visit</summary><form ref={visitForm} action={submitVisit} className="account-profile-form timeline-form">
          <label htmlFor="hospital-visit-type">Visit type</label><select id="hospital-visit-type" name="visitType" defaultValue="consultation"><option value="consultation">Consultation</option><option value="outpatient">Outpatient</option><option value="emergency">Emergency</option><option value="procedure">Procedure</option><option value="other">Other</option></select>
          <label htmlFor="hospital-visit-at">Date and time</label><input id="hospital-visit-at" name="visitAt" type="datetime-local" onChange={(event) => setTimezoneOffset(event, "visitAtOffset")} required /><input type="hidden" name="visitAtOffset" defaultValue="0" />
          <label htmlFor="hospital-visit-facility">Hospital or clinic <span>(optional)</span></label><input id="hospital-visit-facility" name="facilityName" maxLength={160} />
          <label htmlFor="hospital-visit-provider">Clinician name <span>(optional)</span></label><input id="hospital-visit-provider" name="providerName" maxLength={120} />
          <label htmlFor="hospital-visit-notes">Notes <span>(optional)</span></label><textarea id="hospital-visit-notes" name="notes" rows={3} maxLength={1200} />
          {isAdolescent ? <><label htmlFor="hospital-visit-visibility">Privacy</label><select id="hospital-visit-visibility" name="visibility" defaultValue="general"><option value="general">General profile note</option><option value="sensitive_adolescent">Sensitive adolescent note</option></select></> : <input type="hidden" name="visibility" value="general" />}
          {visitState.message && <p className={`account-form-message ${visitState.status}`} role="status">{visitState.status === "success" && <Check size={15} />}{visitState.message}</p>}
          <button className="primary-button account-submit" type="submit" disabled={visitPending}><Plus size={16} />{visitPending ? "Saving…" : "Save visit"}</button>
        </form></details>
        <details className="account-entry-disclosure"><summary>Record a hospital stay</summary><form ref={admissionForm} action={submitAdmission} className="account-profile-form timeline-form">
          <label htmlFor="hospital-admitted-at">Admitted</label><input id="hospital-admitted-at" name="admittedAt" type="datetime-local" onChange={(event) => setTimezoneOffset(event, "admittedAtOffset")} required /><input type="hidden" name="admittedAtOffset" defaultValue="0" />
          <label htmlFor="hospital-discharged-at">Discharged <span>(leave blank if not recorded)</span></label><input id="hospital-discharged-at" name="dischargedAt" type="datetime-local" onChange={(event) => setTimezoneOffset(event, "dischargedAtOffset")} /><input type="hidden" name="dischargedAtOffset" defaultValue="0" />
          <label htmlFor="hospital-admission-facility">Hospital <span>(optional)</span></label><input id="hospital-admission-facility" name="facilityName" maxLength={160} />
          <label htmlFor="hospital-admission-summary">Discharge or stay note <span>(optional)</span></label><textarea id="hospital-admission-summary" name="summary" rows={3} maxLength={2000} />
          <label htmlFor="hospital-discharge-document">Discharge document <span>(optional; privacy must match this stay)</span></label><select id="hospital-discharge-document" name="dischargeDocumentId" defaultValue=""><option value="">No document linked</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.display_name}{document.visibility === "sensitive_adolescent" ? " · private" : ""}</option>)}</select>
          {isAdolescent ? <><label htmlFor="hospital-admission-visibility">Privacy</label><select id="hospital-admission-visibility" name="visibility" defaultValue="general"><option value="general">General profile note</option><option value="sensitive_adolescent">Sensitive adolescent note</option></select></> : <input type="hidden" name="visibility" value="general" />}
          {admissionState.message && <p className={`account-form-message ${admissionState.status}`} role="status">{admissionState.status === "success" && <Check size={15} />}{admissionState.message}</p>}
          <button className="primary-button account-submit" type="submit" disabled={admissionPending}><Plus size={16} />{admissionPending ? "Saving…" : "Save hospital stay"}</button>
        </form></details>
      </div>}
    </>}
  </section>;
}
