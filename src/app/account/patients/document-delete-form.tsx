"use client";

import { useActionState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { removePatientDocument, type DocumentFormState } from "./actions";

const initialState: DocumentFormState = { status: "idle", message: "" };

export default function DocumentDeleteForm({ patientId, documentId }: { patientId: string; documentId: string }) {
  const actionForDocument = removePatientDocument.bind(null, patientId, documentId);
  const [state, action, pending] = useActionState(actionForDocument, initialState);
  const confirmRemoval = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Remove this private file and its saved OCR text? The deletion cannot be undone.")) event.preventDefault();
  };

  return <form action={action} className="document-delete-form" onSubmit={confirmRemoval}>
    <button className="document-delete-button" type="submit" disabled={pending}><Trash2 size={14} />{pending ? "Removing file…" : "Remove file"}</button>
    {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
  </form>;
}
