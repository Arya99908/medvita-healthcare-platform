"use client";

import { useState } from "react";
import { AlertTriangle, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import type { DemoProfile } from "@/lib/demo-data";

export default function EmergencySection({ profile }: { profile: DemoProfile }) {
  const [dialerMessage, setDialerMessage] = useState("");

  return <section className="emergency-page" aria-labelledby="emergency-title">
    <div className="emergency-banner"><span className="emergency-alert-icon"><AlertTriangle size={22} /></span><div><span className="micro-label">DEVICE-ASSISTED DEMO</span><h2 id="emergency-title">Need urgent help?</h2><p>Choose a number to open your device dialer. MedVita does not place the call or dispatch an ambulance.</p></div></div>
    <div className="emergency-call-grid">
      <article className="emergency-call-card national"><div><span className="emergency-call-label">India · all-emergency number</span><strong>112</strong><p>National Emergency Response Support System</p></div><a href="tel:112" aria-label="Open device dialer for 112" onClick={() => setDialerMessage("Your device may open its dialer. This demo cannot tell whether a call was placed or help is on the way.")}><Phone size={17} /> Call 112</a></article>
      <article className="emergency-call-card regional"><div><span className="emergency-call-label">Karnataka · ambulance service</span><strong>108</strong><p>Regional ambulance option for the Bengaluru sample profiles</p></div><a href="tel:108" aria-label="Open device dialer for 108" onClick={() => setDialerMessage("Your device may open its dialer. This demo cannot tell whether a call was placed or help is on the way.")}><Phone size={17} /> Call 108</a></article>
    </div>
    <p className="dialer-status" role="status" aria-live="polite">{dialerMessage}</p>
    <p className="emergency-location-note"><MapPin size={16} /> Emergency services and coverage vary by location. Confirm the correct local service if the patient is outside Karnataka.</p>
    <div className="emergency-summary-grid">
      <article className="section-card emergency-medical-card"><div className="card-heading"><div><span className="micro-label">FICTIONAL QUICK REFERENCE</span><h3>{profile.name}&apos;s emergency summary</h3><p>Sample information only; it has not been clinically verified.</p></div><ShieldCheck size={19} /></div><dl><div><dt>Age</dt><dd>{profile.age}</dd></div><div><dt>Sample conditions</dt><dd>{profile.sampleConditions.join(" · ")}</dd></div><div><dt>Sample allergies</dt><dd>{profile.sampleAllergies.join(" · ")}</dd></div><div><dt>Care connection</dt><dd>{profile.careContact}</dd></div></dl></article>
      <article className="section-card emergency-contacts-card"><div className="card-heading"><div><span className="micro-label">CARE CONNECTION</span><h3>People to contact</h3></div><Users size={19} /></div><p>{profile.careContact}</p><div className="info-callout"><AlertTriangle size={16} /><p>No phone number or contact-notification service is configured. This demo cannot alert family members or share location.</p></div></article>
    </div>
    <p className="emergency-disclaimer">If someone may be in immediate danger, use your phone to contact the appropriate local emergency service. Do not wait for this demo or assume an ambulance has been sent.</p>
  </section>;
}
