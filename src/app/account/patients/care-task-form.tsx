"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import { Check, ClipboardList, Plus } from "lucide-react";
import { createCaregiverTask, updateCaregiverTaskStatus, type CareLogFormState } from "./actions";

const initialState: CareLogFormState = { status: "idle", message: "" };

function updateTimezoneOffset(event: ChangeEvent<HTMLInputElement>) {
  const field = event.currentTarget.form?.elements.namedItem("dueAtOffset");
  if (field instanceof HTMLInputElement) field.value = event.currentTarget.value ? String(new Date(event.currentTarget.value).getTimezoneOffset()) : "0";
}

export function CareTaskForm({ patientId, assignees }: { patientId: string; assignees: { user_id: string; relationship_role: string }[] }) {
  const [state, action, pending] = useActionState(createCaregiverTask.bind(null, patientId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return <details className="account-card account-entry-disclosure">
    <summary className="account-card-heading"><div><span className="micro-label">CAREGIVER TASKS</span><h2>Add a care task</h2><p>Tasks are assigned to your account and are visible to authorised profile readers.</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></summary>
    <form ref={formRef} action={action} className="account-profile-form timeline-form">
      <label htmlFor="care-task-assignee">Assign to</label><select id="care-task-assignee" name="assignedTo" defaultValue=""><option value="">You</option>{assignees.map((assignee) => <option key={assignee.user_id} value={assignee.user_id}>{assignee.relationship_role.replaceAll("_", " ")} · account ending {assignee.user_id.slice(-4)}</option>)}</select>
      <label htmlFor="care-task-title">Task</label><input id="care-task-title" name="title" minLength={2} maxLength={120} required placeholder="e.g. Prepare for the clinic visit" />
      <label htmlFor="care-task-due-at">Due date and time <span>(optional)</span></label><input id="care-task-due-at" name="dueAt" type="datetime-local" onChange={updateTimezoneOffset} /><input type="hidden" name="dueAtOffset" defaultValue="0" />
      <label htmlFor="care-task-notes">Notes <span>(optional)</span></label><textarea id="care-task-notes" name="notes" rows={3} maxLength={500} placeholder="Short handover or preparation note" />
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.status === "success" && <Check size={15} />}{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? "Saving…" : "Save care task"}</button>
    </form>
  </details>;
}

export function CareTaskStatusForm({ patientId, taskId, status, assignedTo, createdBy, currentUserId, canMarkMissed }: { patientId: string; taskId: string; status: string; assignedTo: string | null; createdBy: string | null; currentUserId: string; canMarkMissed: boolean }) {
  const [state, action, pending] = useActionState(updateCaregiverTaskStatus.bind(null, patientId), initialState);
  return <form action={action} className="care-task-status-form">
    <input type="hidden" name="taskId" value={taskId} />
    {(assignedTo === currentUserId || createdBy === currentUserId) && (status === "open" ? <><button className="secondary-button" name="status" value="complete" type="submit" disabled={pending}>{pending ? "Saving…" : "Mark complete"}</button>{canMarkMissed && <button className="secondary-button" name="status" value="missed" type="submit" disabled={pending}>{pending ? "Saving…" : "Mark missed"}</button>}</> : <button className="secondary-button" name="status" value="open" type="submit" disabled={pending}>{pending ? "Saving…" : "Reopen task"}</button>)}
    {state.message && <span className={`account-form-message ${state.status}`} role="status">{state.message}</span>}
  </form>;
}
