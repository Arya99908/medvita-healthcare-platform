"use client";

import { useActionState } from "react";
import { updateAppointmentStatus, type AppointmentStatusFormState } from "./actions";

const initialState: AppointmentStatusFormState = { status: "idle", message: "" };

export default function AppointmentStatusForm({ patientId, appointmentId, status }: { patientId: string; appointmentId: string; status: string }) {
  const actionForPatient = updateAppointmentStatus.bind(null, patientId);
  const [state, action, pending] = useActionState(actionForPatient, initialState);

  return <form action={action} className="appointment-status-form">
    <input type="hidden" name="appointmentId" value={appointmentId} />
    {status === "scheduled" ? <>
      <button type="submit" name="status" value="completed" className="account-record-link" disabled={pending}>{pending ? "Saving…" : "Mark plan complete"}</button>
      <button type="submit" name="status" value="cancelled" className="account-record-link" disabled={pending}>{pending ? "Saving…" : "Mark plan canceled"}</button>
    </> : <button type="submit" name="status" value="scheduled" className="account-record-link" disabled={pending}>{pending ? "Saving…" : "Return to scheduled"}</button>}
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
  </form>;
}
