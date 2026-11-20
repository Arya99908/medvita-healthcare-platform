"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { Check, Clock3, Plus } from "lucide-react";
import { createMedicationSchedule, logMedicationAdministration, type MedicationFormState } from "./actions";

const initialState: MedicationFormState = { status: "idle", message: "" };
type ScheduleOption = { id: string; frequency: string; status: string };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>) {
  const field = event.currentTarget.form?.elements.namedItem("administeredAtOffset");
  if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
}

export function MedicationScheduleForm({ patientId, medicationId }: { patientId: string; medicationId: string }) {
  const [state, action, pending] = useActionState(createMedicationSchedule.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const suffix = medicationId.replaceAll("-", "");
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return <details className="medication-schedule-disclosure">
    <summary>Record a schedule</summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <input type="hidden" name="medicationId" value={medicationId} />
      <p className="timeline-privacy-note">Copy frequency and times from an existing prescription or care plan. This saves a record only; it does not send reminders or advise a dose.</p>
      <label htmlFor={`med-schedule-frequency-${suffix}`}>Frequency as written</label><input id={`med-schedule-frequency-${suffix}`} name="frequency" maxLength={120} required placeholder="Copy from the care plan" />
      <label htmlFor={`med-schedule-times-${suffix}`}>Times <span>(optional, 24-hour time; comma separated)</span></label><input id={`med-schedule-times-${suffix}`} name="administrationTimes" maxLength={64} placeholder="08:00, 20:00" />
      <label htmlFor={`med-schedule-start-${suffix}`}>Start date <span>(optional)</span></label><input id={`med-schedule-start-${suffix}`} name="startsOn" type="date" />
      <label htmlFor={`med-schedule-end-${suffix}`}>End date <span>(optional)</span></label><input id={`med-schedule-end-${suffix}`} name="endsOn" type="date" />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save schedule"}</button>
    </form>
  </details>;
}

export function MedicationAdministrationForm({ patientId, medicationId, schedules }: { patientId: string; medicationId: string; schedules: ScheduleOption[] }) {
  const [state, action, pending] = useActionState(logMedicationAdministration.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const suffix = medicationId.replaceAll("-", "");
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return <details className="medication-schedule-disclosure">
    <summary><Clock3 size={15} /> Log a dose event</summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <input type="hidden" name="medicationId" value={medicationId} />
      <label htmlFor={`med-log-status-${suffix}`}>What happened?</label><select id={`med-log-status-${suffix}`} name="status" defaultValue="taken"><option value="taken">Taken</option><option value="missed">Missed</option><option value="skipped">Skipped</option><option value="uncertain">Not sure</option></select>
      {schedules.length > 0 && <><label htmlFor={`med-log-schedule-${suffix}`}>Schedule <span>(optional)</span></label><select id={`med-log-schedule-${suffix}`} name="scheduleId" defaultValue=""><option value="">Not linked to a schedule</option>{schedules.filter((schedule) => schedule.status === "active").map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.frequency}</option>)}</select></>}
      <label htmlFor={`med-log-time-${suffix}`}>Event time <span>(scheduled time if logging a missed or skipped dose)</span></label><input id={`med-log-time-${suffix}`} name="administeredAt" type="datetime-local" onChange={updateTimezoneOffset} required /><input type="hidden" name="administeredAtOffset" defaultValue="0" />
      <label htmlFor={`med-log-note-${suffix}`}>Note <span>(optional)</span></label><textarea id={`med-log-note-${suffix}`} name="notes" rows={2} maxLength={500} />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save dose event"}</button>
    </form>
  </details>;
}
