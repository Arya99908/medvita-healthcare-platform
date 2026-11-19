"use client";

import { useActionState, useEffect, useRef } from "react";
import { Activity, Check, Plus } from "lucide-react";
import { createVitalRecord, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

export default function VitalForm({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState(createVitalRecord.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">VITALS LOG</span><h2>Add a reading</h2><p>Patient or caregiver report only; no interpretation is provided.</p></div><span className="account-card-icon"><Activity size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="vital-type">What are you recording?</label><select id="vital-type" name="vitalType" defaultValue="blood_pressure_systolic">
        <option value="blood_pressure_systolic">Blood pressure · systolic (mmHg)</option>
        <option value="blood_pressure_diastolic">Blood pressure · diastolic (mmHg)</option>
        <option value="blood_glucose">Blood glucose (mg/dL)</option>
        <option value="weight">Weight (kg)</option><option value="height">Height (cm)</option>
        <option value="temperature">Temperature (°C)</option><option value="heart_rate">Heart rate (bpm)</option>
        <option value="oxygen_saturation">Oxygen saturation (%)</option>
      </select>
      <label htmlFor="vital-value">Reading</label><input id="vital-value" name="value" type="number" min="0" max="1000" step="0.1" inputMode="decimal" required />
      <p className="timeline-privacy-note">Use the unit shown. The system saves this reading without checking whether it is healthy or urgent.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save reading"}</button>
    </form>
  </details>;
}
