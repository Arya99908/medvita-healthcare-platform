"use client";

import { useActionState, useState } from "react";
import { FileSearch, ScanText, ShieldCheck } from "lucide-react";
import type { Json } from "@/lib/database.types";
import { documentOCRFieldDefinitions, parseDocumentOCRCandidates, type DocumentOCRCandidates } from "@/lib/document-ocr-candidates";
import { reviewDocumentOCR, saveDocumentOCR, type DocumentOCRActionState } from "./document-ocr-actions";

type Extraction = { id: string; extracted_fields: Json; review_status: string; created_at: string };
const initialState: DocumentOCRActionState = { status: "idle", message: "" };
const maxFileBytes = 4 * 1024 * 1024;
const maxPdfPages = 5;
const maxCanvasPixels = 16_000_000;

function extractedText(fields: Json) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return "";
  const text = (fields as Record<string, Json>).rawText;
  return typeof text === "string" ? text : "";
}

function extractedCandidates(fields: Json): DocumentOCRCandidates {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return parseDocumentOCRCandidates("");
  const value = (fields as Record<string, Json>).candidates;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidates = Object.fromEntries(documentOCRFieldDefinitions.map(({ name }) => [name, value[name]]));
    if (documentOCRFieldDefinitions.every(({ name }) => typeof candidates[name] === "string")) return candidates as DocumentOCRCandidates;
  }
  return parseDocumentOCRCandidates(extractedText(fields));
}

async function imageCanvas(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, 2600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the image for reading.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

async function runDocumentOCR(downloadUrl: string, mimeType: string, onProgress: (value: string) => void) {
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error("The private document could not be downloaded. Reload the profile and try again.");
  const blob = await response.blob();
  if (blob.size === 0 || blob.size > maxFileBytes) throw new Error("OCR supports files up to 4 MB.");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core/",
    langPath: "/ocr/lang",
    gzip: true,
    logger: (event) => onProgress(event.status === "recognizing text" ? `Reading text (${Math.round(event.progress * 100)}%)` : "Preparing on-device text reader…"),
  });
  try {
    const segments: string[] = [];
    if (mimeType === "application/pdf") {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({
        data: await blob.arrayBuffer(),
        enableXfa: false,
        cMapUrl: "/ocr/pdf-assets/cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "/ocr/pdf-assets/standard_fonts/",
        wasmUrl: "/ocr/pdf-assets/wasm/",
        iccUrl: "/ocr/pdf-assets/iccs/",
      });
      try {
        const pdf = await loadingTask.promise;
        if (pdf.numPages > maxPdfPages) throw new Error(`For safety, OCR is limited to ${maxPdfPages} pages at a time. This PDF has ${pdf.numPages} pages.`);
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          onProgress(`Reading page ${pageNumber} of ${pdf.numPages}…`);
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const nativeText = textContent.items.map((item) => "str" in item ? item.str : "").join(" ").trim();
          if (nativeText.length >= 30) {
            segments.push(nativeText);
            page.cleanup();
            continue;
          }
          const viewportAtOne = page.getViewport({ scale: 1 });
          const scale = Math.min(1.6, Math.sqrt(maxCanvasPixels / (viewportAtOne.width * viewportAtOne.height)));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Your browser could not prepare a PDF page for reading.");
          try {
            await page.render({ canvasContext: context, canvas, viewport }).promise;
            const result = await worker.recognize(canvas);
            segments.push(result.data.text.trim());
          } finally {
            canvas.width = 0;
            canvas.height = 0;
            page.cleanup();
          }
        }
      } finally {
        await loadingTask.destroy();
      }
    } else if (mimeType === "image/jpeg" || mimeType === "image/png") {
      onProgress("Preparing image…");
      const canvas = await imageCanvas(blob);
      const result = await worker.recognize(canvas);
      segments.push(result.data.text.trim());
      canvas.width = 0;
      canvas.height = 0;
    } else {
      throw new Error("This file is not a supported PDF, JPG, or PNG document.");
    }
    const text = segments.filter(Boolean).join("\n\n--- Page break ---\n\n");
    if (text.length > 30_000) throw new Error("This extraction is longer than the review form allows. Try a shorter document.");
    if (!text) throw new Error("No text was found. You can still view and download the original document.");
    return text;
  } finally {
    await worker.terminate();
  }
}

export default function DocumentOCR({
  patientId, documentId, documentName, mimeType, downloadUrl, canWrite, extractions,
}: {
  patientId: string;
  documentId: string;
  documentName: string;
  mimeType: string;
  downloadUrl: string | null;
  canWrite: boolean;
  extractions: Extraction[];
}) {
  const [recognizedText, setRecognizedText] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [saveState, saveAction, saving] = useActionState(saveDocumentOCR, initialState);

  async function startOCR() {
    if (!downloadUrl || running) return;
    setRunning(true);
    setError("");
    setRecognizedText("");
    try {
      setRecognizedText(await runDocumentOCR(downloadUrl, mimeType, setProgress));
      setProgress("Text ready for review.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "OCR could not read this document. Try again or use the original file.");
      setProgress("");
    } finally {
      setRunning(false);
    }
  }

  return <details className="document-ocr-disclosure">
    <summary><FileSearch size={16} /> Read text on this device</summary>
    <div className="document-ocr-content">
      <p className="timeline-privacy-note"><ShieldCheck size={15} /> The file is processed in this browser. It is not sent to an AI provider. The first use downloads the English OCR model and saves it in this browser. The source document and OCR text may contain sensitive information.</p>
      <p className="timeline-privacy-note">OCR can misread names, dates, medicine labels, and test values. Check every line against the original. Text is saved only when you choose to save it, remains unverified, and is not added to structured records.</p>
      {canWrite && <button className="secondary-button document-ocr-run" type="button" onClick={startOCR} disabled={running || !downloadUrl}><ScanText size={15} />{running ? "Reading…" : "Start OCR"}</button>}
      {!canWrite && <p className="timeline-privacy-note">You have read-only access. A person with active write access can save an extraction for review.</p>}
      {!downloadUrl && <p className="account-form-message error" role="status">The download link is unavailable. Reload the page to create a new private link.</p>}
      {progress && <p className="account-form-message" role="status" aria-live="polite">{progress}</p>}
      {error && <p className="account-form-message error" role="alert">{error}</p>}
      {recognizedText && canWrite && <form action={saveAction} className="account-profile-form timeline-form document-ocr-review-form">
        <input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="documentId" value={documentId} />
        <label htmlFor={`ocr-text-${documentId}`}>OCR text from {documentName}</label>
        <textarea id={`ocr-text-${documentId}`} name="recognizedText" value={recognizedText} onChange={(event) => setRecognizedText(event.target.value)} rows={10} maxLength={30_000} required />
        <small>You can correct the text before saving it as pending review.</small>
        {saveState.message && <p className={`account-form-message ${saveState.status}`} role="status">{saveState.message}</p>}
        <button className="primary-button account-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save unverified text for review"}</button>
      </form>}
      {extractions.length > 0 && <div className="document-ocr-history"><h4>Saved extractions</h4>{extractions.map((extraction) => <ReviewedExtraction key={extraction.id} patientId={patientId} extraction={extraction} canWrite={canWrite} />)}</div>}
    </div>
  </details>;
}

function ReviewedExtraction({ patientId, extraction, canWrite }: { patientId: string; extraction: Extraction; canWrite: boolean }) {
  const [state, action, pending] = useActionState(reviewDocumentOCR, initialState);
  const text = extractedText(extraction.extracted_fields);
  const candidates = extractedCandidates(extraction.extracted_fields);
  return <details className="document-ocr-history-item"><summary>{extraction.review_status.replaceAll("_", " ")} · {new Date(extraction.created_at).toLocaleDateString()}</summary>
    {extraction.review_status === "pending" && canWrite ? <form action={action} className="account-profile-form timeline-form document-ocr-review-form">
      <input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="extractionId" value={extraction.id} />
      <label htmlFor={`reviewed-ocr-${extraction.id}`}>Check and correct against the original file</label><textarea id={`reviewed-ocr-${extraction.id}`} name="reviewedText" defaultValue={text} maxLength={30_000} rows={10} required />
      <fieldset className="document-ocr-candidates"><legend>Candidate fields to check</legend><p>Suggestions use visible labels and measurement patterns. They can be wrong or incomplete. Compare each field with the original and edit or clear it.</p>{documentOCRFieldDefinitions.map((field) => <label key={field.name} htmlFor={`ocr-candidate-${field.name}-${extraction.id}`}>{field.label}<textarea id={`ocr-candidate-${field.name}-${extraction.id}`} name={`candidate_${field.name}`} defaultValue={candidates[field.name]} rows={field.name === "laboratoryValues" || field.name === "relevantFindings" ? 4 : 2} maxLength={4_000} /></label>)}</fieldset>
      <label htmlFor={`review-status-${extraction.id}`}>Review decision</label><select id={`review-status-${extraction.id}`} name="reviewStatus" defaultValue="accepted"><option value="accepted">I checked these fields against the document</option><option value="rejected">The OCR or suggestions are unusable</option></select>
      <p className="timeline-privacy-note">Accepting confirms only that you checked the transcription and fields. They remain separate from the profile&apos;s verified medical records.</p>
      {state.message && <p className={`account-form-message ${state.status}`} role="status">{state.message}</p>}
      <button className="primary-button account-submit" type="submit" disabled={pending}>{pending ? "Saving review…" : "Save reviewed fields"}</button>
    </form> : <><p className="timeline-privacy-note">{extraction.review_status === "pending" ? "Pending review; these are unverified suggestions." : extraction.review_status === "accepted" ? "User-reviewed transcription and fields. They remain separate from the profile's verified medical records." : "Rejected transcription; not used in the structured health record."}</p>{extraction.review_status !== "rejected" && <dl className="document-ocr-field-list">{documentOCRFieldDefinitions.map((field) => <div key={field.name}><dt>{field.label}</dt><dd>{candidates[field.name] || "No candidate found"}</dd></div>)}</dl>}<details><summary>Show OCR text</summary><pre>{text}</pre></details></>}
  </details>;
}
