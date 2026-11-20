"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertTriangle, MapPin, Phone, Plus, ShieldCheck, Siren, Trash2, Users } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { createEmergencyContact, deleteEmergencyContact, recordEmergencyAlert, type CareLogFormState } from "./actions";

type Contact = { id: string; display_name: string; relationship: string | null; phone: string; priority: number };
type Alert = { id: string; alert_type: string; status: string; created_at: string; message: string | null };
type SummaryItem = { id: string; label: string; detail?: string | null };
type Props = { patientId: string; patientName: string; dateOfBirth: string | null; conditions: SummaryItem[]; allergies: SummaryItem[]; medications: SummaryItem[]; contacts: Contact[]; alerts: Alert[]; canWrite: boolean; contactsError: boolean; alertsError: boolean; summaryError: boolean };

const initialState: CareLogFormState = { status: "idle", message: "" };

function ageFromDateOfBirth(dateOfBirth: string | null) {
  if (!dateOfBirth) return "Not recorded";
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.valueOf()) || birth > new Date()) return "Not recorded";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return `${age} years`;
}

function telValue(phone: string) { return phone.replace(/[^+\d]/g, ""); }

function ContactRow({ patientId, contact, canWrite }: { patientId: string; contact: Contact; canWrite: boolean }) {
  const [state, action, pending] = useActionState(deleteEmergencyContact.bind(null, patientId, contact.id), initialState);
  const confirmRemove = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Remove ${contact.display_name} from this profile's emergency contacts?`)) event.preventDefault();
  };
  return <li className="patient-emergency-contact"><div><strong>{contact.priority === 1 ? "Primary" : contact.priority === 2 ? "Secondary" : `Contact ${contact.priority}`} · {contact.display_name}</strong><span>{[contact.relationship, contact.phone].filter(Boolean).join(" · ")}</span></div><a className="account-record-link" href={`tel:${telValue(contact.phone)}`}><Phone size={14} /> Call</a>{canWrite && <form action={action} onSubmit={confirmRemove}><button className="account-record-link emergency-remove-contact" type="submit" disabled={pending} aria-label={`Remove ${contact.display_name}`}>{pending ? "Removing…" : <Trash2 size={14} />}</button></form>}{state.message && <span className={`account-form-message ${state.status}`} role="status">{state.message}</span>}</li>;
}

export default function PatientEmergencyPanel({ patientId, patientName, dateOfBirth, conditions, allergies, medications, contacts, alerts, canWrite, contactsError, alertsError, summaryError }: Props) {
  const [contactState, contactAction, contactPending] = useActionState(createEmergencyContact.bind(null, patientId), initialState);
  const [alertState, alertAction, alertPending] = useActionState(recordEmergencyAlert.bind(null, patientId), initialState);
  const [locationMessage, setLocationMessage] = useState("");
  const shareLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("Location is not available in this browser."); return; }
    setLocationMessage("Requesting your permission to use this device’s current location…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const link = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
      try {
        if (navigator.share) await navigator.share({ title: "My current location", text: "I chose to share my current location for emergency help.", url: link });
        else if (navigator.clipboard) await navigator.clipboard.writeText(link);
        else { setLocationMessage(link); return; }
        setLocationMessage("Location shared using your device’s share sheet, or copied to clipboard. MedVita did not send or store it.");
      } catch (error) {
        setLocationMessage(error instanceof Error && error.name === "AbortError" ? "Location sharing was cancelled." : "Location could not be shared. You can try again or read the coordinates to emergency responders.");
      }
    }, (error) => setLocationMessage(error.code === error.PERMISSION_DENIED ? "Location permission was declined. You can still call emergency services manually." : "Could not get this device’s current location. You can still call emergency services manually."), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 });
  };

  return <section className="account-card patient-emergency-panel" aria-labelledby="patient-emergency-title">
    <div className="account-card-heading"><div><span className="micro-label">EMERGENCY ACCESS</span><h2 id="patient-emergency-title">Emergency help for {patientName}</h2><p>Calls and location sharing require your explicit action on this device.</p></div><span className="account-card-icon emergency-icon"><Siren size={18} /></span></div>
    <div className="emergency-action-disclaimer"><AlertTriangle size={17} /><span>This app cannot dispatch an ambulance or notify contacts. If this may be an emergency, call the appropriate local service now.</span></div>
    {canWrite && <form action={alertAction} className="emergency-record-form">
      <strong>Record an emergency action</strong><p>This adds a private history entry only; it does not start a call or send a notification.</p>
      <div><button type="submit" name="alertType" value="ambulance_call_requested" disabled={alertPending}><Siren size={16} /> {alertPending ? "Recording…" : "Record ambulance call request"}</button><button type="submit" name="alertType" value="sos_call_requested" disabled={alertPending}><AlertTriangle size={16} /> Record SOS action</button></div>
      {alertState.message && <p className={`account-form-message ${alertState.status}`} role="status">{alertState.message}</p>}
    </form>}
    <div className="emergency-manual-call-grid"><article><span>India general emergency number · confirm local availability</span><strong>112</strong><a href="tel:112"><Phone size={15} /> Open dialer for 112</a></article><article><span>Karnataka regional ambulance example · use only where applicable</span><strong>108</strong><a href="tel:108"><Phone size={15} /> Open dialer for 108</a></article></div>
    <button type="button" className="emergency-share-location" onClick={shareLocation}><MapPin size={15} /> Share this device&apos;s location</button>
    {locationMessage && <p className="emergency-location-feedback" role="status">{locationMessage}</p>}
    <div className="patient-emergency-grid">
      <section className="patient-emergency-summary" aria-label="Medical emergency summary"><h3><ShieldCheck size={16} /> Medical summary · unverified records</h3><dl><div><dt>Patient</dt><dd>{patientName}</dd></div><div><dt>Age</dt><dd>{ageFromDateOfBirth(dateOfBirth)}</dd></div><div><dt>Conditions</dt><dd>{summaryError ? "Could not load records" : conditions.length ? conditions.map((item) => item.label).join(", ") : "None recorded"}</dd></div><div><dt>Allergies</dt><dd>{summaryError ? "Could not load records" : allergies.length ? allergies.map((item) => item.detail ? `${item.label} (${item.detail})` : item.label).join(", ") : "None recorded"}</dd></div><div><dt>Current medicine notes</dt><dd>{summaryError ? "Could not load records" : medications.length ? medications.map((item) => item.detail ? `${item.label} · ${item.detail}` : item.label).join(", ") : "None recorded"}</dd></div></dl><p>These are user-entered records. Verify them with the patient or clinician before relying on them.</p></section>
      <section className="patient-emergency-contacts" aria-label="Emergency contacts"><h3><Users size={16} /> People to call</h3>{contactsError ? <p>Emergency contact information could not be loaded. Reload or try again later.</p> : contacts.length ? <ul>{contacts.map((contact) => <ContactRow key={contact.id} patientId={patientId} contact={contact} canWrite={canWrite} />)}</ul> : <p>No contacts are saved for this profile.</p>}
        {canWrite && <details className="emergency-contact-add"><summary><Plus size={14} /> Add emergency contact</summary><form action={contactAction}><label>Name<input name="displayName" required minLength={2} maxLength={80} /></label><label>Relationship (optional)<input name="relationship" maxLength={80} /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required maxLength={24} placeholder="+91 98765 43210" /></label><label>Priority<select name="priority" defaultValue="1"><option value="1">Primary</option><option value="2">Secondary</option><option value="3">Additional</option></select></label><p>Saving a contact does not notify them.</p>{contactState.message && <p className={`account-form-message ${contactState.status}`} role="status">{contactState.message}</p>}<button className="account-record-link" type="submit" disabled={contactPending}>{contactPending ? "Saving…" : "Save contact"}</button></form></details>}
      </section>
    </div>
    <section className="emergency-history" aria-label="Emergency action history"><h3>Emergency action history</h3>{alertsError ? <p>Emergency history could not be loaded.</p> : alerts.length ? <ol>{alerts.map((alert) => <li key={alert.id}><span>{alert.alert_type.replaceAll("_", " ")} · recorded only ({alert.status})</span><LocalDateTime value={alert.created_at} />{alert.message && <p>{alert.message}</p>}</li>)}</ol> : <p>No emergency actions recorded.</p>}</section>
  </section>;
}
