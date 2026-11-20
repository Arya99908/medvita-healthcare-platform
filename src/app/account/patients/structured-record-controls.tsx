"use client";

import { useActionState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteStructuredHealthRecord, updateStructuredHealthRecord, type CareLogFormState } from "./actions";

type RecordType = "symptom" | "medical_condition" | "vital" | "feeding" | "bowel" | "vomiting" | "growth" | "urination" | "sleep" | "vaccination" | "developmental" | "menstrual";
type Field = { name: string; label: string; type?: "text" | "number" | "date" | "textarea" | "select"; min?: number; max?: number; step?: number; required?: boolean; options?: Array<{ value: string; label: string }> };

const fieldsByType: Record<RecordType, Field[]> = {
  symptom: [
    { name: "symptom", label: "What did you notice?", max: 120, required: true },
    { name: "severity", label: "How noticeable was it?", type: "select", options: ["1 · Very mild", "2 · Mild", "3 · Moderate", "4 · Strong", "5 · Very strong"].map((label, index) => ({ value: String(index + 1), label })) },
    { name: "notes", label: "Extra note", type: "textarea", max: 500 },
  ],
  medical_condition: [
    { name: "name", label: "Condition", max: 100, required: true },
    { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Current" }, { value: "resolved", label: "Resolved" }, { value: "historical", label: "Past" }] },
    { name: "diagnosed_on", label: "Diagnosis date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea", max: 500 },
  ],
  vital: [{ name: "value", label: "Reading", type: "number", min: 0.01, max: 1000, step: 0.1, required: true }],
  feeding: [
    { name: "feeding_type", label: "Feeding type", type: "select", required: true, options: [{ value: "breastfeeding", label: "Breastfeeding" }, { value: "formula", label: "Formula" }, { value: "solid_food", label: "Solid food" }, { value: "other", label: "Other" }] },
    { name: "quantity_ml", label: "Quantity (ml)", type: "number", min: 0, max: 2000, step: 0.1 },
    { name: "duration_minutes", label: "Duration (minutes)", type: "number", min: 0, max: 600, step: 1 },
    { name: "notes", label: "Observation", type: "textarea", max: 500 },
  ],
  bowel: [
    { name: "consistency", label: "Consistency", max: 60 },
    { name: "color", label: "Colour", max: 60 },
    { name: "notes", label: "Observation", type: "textarea", max: 500 },
  ],
  vomiting: [
    { name: "count", label: "Number of episodes", type: "number", min: 1, max: 100, step: 1, required: true },
    { name: "associated_notes", label: "Associated observations", type: "textarea", max: 500 },
  ],
  growth: [
    { name: "weight_kg", label: "Weight (kg)", type: "number", min: 0.01, max: 250, step: 0.01 },
    { name: "height_cm", label: "Height or length (cm)", type: "number", min: 0.01, max: 300, step: 0.01 },
    { name: "head_circumference_cm", label: "Head circumference (cm)", type: "number", min: 0.01, max: 100, step: 0.01 },
  ],
  urination: [
    { name: "urination_type", label: "Type", type: "select", required: true, options: [{ value: "wet_diaper", label: "Wet diaper" }, { value: "toilet", label: "Toilet" }, { value: "other", label: "Other" }] },
    { name: "count", label: "Number recorded", type: "number", min: 1, max: 100, step: 1, required: true },
    { name: "volume_ml", label: "Volume (ml)", type: "number", min: 0.1, max: 5000, step: 0.1 },
    { name: "notes", label: "Observation", type: "textarea", max: 500 },
  ],
  sleep: [
    { name: "sleep_type", label: "Type", type: "select", options: [{ value: "nap", label: "Nap" }, { value: "overnight", label: "Overnight" }, { value: "other", label: "Other" }] },
    { name: "notes", label: "Observation", type: "textarea", max: 500 },
  ],
  vaccination: [
    { name: "vaccine_name", label: "Vaccine name", max: 100, required: true },
    { name: "dose_label", label: "Dose or series label", max: 60 },
    { name: "status", label: "Record status", type: "select", options: [{ value: "planned", label: "Planned" }, { value: "administered", label: "Administered" }, { value: "cancelled", label: "Cancelled" }] },
    { name: "due_on", label: "Planned or next due date", type: "date" },
    { name: "administered_on", label: "Administered date · required when administered", type: "date" },
    { name: "notes", label: "Notes", type: "textarea", max: 500 },
  ],
  developmental: [
    { name: "milestone_name", label: "Milestone or observation", max: 100, required: true },
    { name: "domain", label: "Area", type: "select", options: [{ value: "motor", label: "Movement" }, { value: "communication", label: "Communication" }, { value: "cognitive", label: "Thinking and learning" }, { value: "social_emotional", label: "Social and emotional" }, { value: "self_care", label: "Self-care" }, { value: "other", label: "Other" }] },
    { name: "status", label: "Observation", type: "select", options: [{ value: "observed", label: "Observed" }, { value: "not_observed", label: "Not observed" }, { value: "follow_up", label: "Follow-up planned" }] },
    { name: "recorded_on", label: "Observation date", type: "date" },
    { name: "follow_up_on", label: "Follow-up date · required when planned", type: "date" },
    { name: "notes", label: "Caregiver notes", type: "textarea", max: 500 },
  ],
  menstrual: [
    { name: "period_start", label: "Period start date", type: "date" },
    { name: "period_end", label: "Period end date", type: "date" },
    { name: "flow_note", label: "Flow note", type: "textarea", max: 500 },
    { name: "symptom_note", label: "Symptom note", type: "textarea", max: 500 },
  ],
};

const initialState: CareLogFormState = { status: "idle", message: "" };

export default function StructuredRecordControls({ patientId, recordId, recordType, values }: {
  patientId: string;
  recordId: string;
  recordType: RecordType;
  values: Record<string, string | number | null>;
}) {
  const [updateState, updateAction, updating] = useActionState(updateStructuredHealthRecord, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteStructuredHealthRecord, initialState);

  return <div className="structured-record-controls">
    <details>
      <summary><Pencil size={14} /> Edit entry</summary>
      <form action={updateAction} className="account-profile-form timeline-form">
        <input type="hidden" name="patientId" value={patientId} />
        <input type="hidden" name="recordId" value={recordId} />
        <input type="hidden" name="recordType" value={recordType} />
        {fieldsByType[recordType].map((field) => {
          const value = values[field.name] ?? "";
          const id = `structured-${recordId}-${field.name}`;
          return <div className="structured-record-field" key={field.name}>
            <label htmlFor={id}>{field.label}</label>
            {field.type === "textarea" ? <textarea id={id} name={field.name} defaultValue={String(value)} maxLength={field.max} rows={2} />
              : field.type === "select" ? <select id={id} name={field.name} defaultValue={String(value)} required={field.required}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                : <input id={id} name={field.name} type={field.type ?? "text"} defaultValue={String(value)} maxLength={field.type === "text" ? field.max : undefined} min={field.min} max={field.type === "number" ? field.max : undefined} step={field.step} required={field.required ?? (!field.type || field.type === "number" && !["quantity_ml", "duration_minutes", "weight_kg", "height_cm", "head_circumference_cm", "volume_ml"].includes(field.name))} />}
          </div>;
        })}
        <p className="timeline-privacy-note">The original entry date and any saved source or verification details stay unchanged. Changes are recorded in profile activity.</p>
        {updateState.message && <p className={`account-form-message ${updateState.status}`} role="status">{updateState.message}</p>}
        <button className="secondary-button" type="submit" disabled={updating}>{updating ? "Saving…" : "Save changes"}</button>
      </form>
    </details>
    <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("Remove this record? It will leave the profile timeline, and the activity history will keep a removal event.")) event.preventDefault(); }}>
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="recordType" value={recordType} />
      <button className="structured-record-delete" type="submit" disabled={deleting}><Trash2 size={14} />{deleting ? "Removing…" : "Remove entry"}</button>
      {deleteState.message && <p className={`account-form-message ${deleteState.status}`} role="status">{deleteState.message}</p>}
    </form>
  </div>;
}
