"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import type { Json } from "@/lib/database.types";
import DocumentOCR from "./document-ocr";

type Extraction = { id: string; extracted_fields: Json; review_status: string; created_at: string };
export type DocumentLibraryItem = {
  id: string;
  display_name: string;
  document_type: string;
  document_date: string | null;
  verification_status: string;
  mimeType: string;
  downloadUrl: string | null;
  previewUrl: string | null;
  extractions: Extraction[];
};

const documentTypeOptions = [
  ["all", "All types"],
  ["care_summary", "Care summary"],
  ["test_result", "Test result"],
  ["prescription_copy", "Prescription copy"],
  ["vaccination_certificate", "Vaccination certificate"],
  ["other", "Other"],
] as const;

export default function DocumentLibrary({ patientId, documents, canWrite }: { patientId: string; documents: DocumentLibraryItem[]; canWrite: boolean }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const filteredDocuments = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return documents.filter((document) => {
      const matchesType = type === "all" || document.document_type === type;
      const matchesSearch = !search || [document.display_name, document.document_type.replaceAll("_", " "), document.document_date ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(search));
      return matchesType && matchesSearch;
    });
  }, [documents, query, type]);

  return <>
    {documents.length > 0 && <div className="document-library-tools">
      <label><span>Find a document</span><span className="document-library-search"><Search size={16} /><input aria-label="Find a document" type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Name, type, or date" /></span></label>
      <label><span>Type</span><select value={type} onChange={(event) => setType(event.currentTarget.value)}>{documentTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p className="document-library-count" role="status">Showing {filteredDocuments.length} of {documents.length} documents</p>
    </div>}
    {filteredDocuments.length ? <div className="timeline-event-list">{filteredDocuments.map((document) => <article key={document.id} className="timeline-event">
      <div className="timeline-event-heading"><span className="timeline-event-type">{document.document_type.replaceAll("_", " ")}</span><span className="timeline-verification">{document.verification_status === "verified" ? "Verified" : "Unverified file"}</span></div>
      <h3>{document.display_name}</h3>{document.document_date && <p>Document date: {document.document_date}</p>}
      {document.downloadUrl ? <a className="account-record-link" href={document.downloadUrl} rel="noreferrer">Download file</a> : <p>Download is unavailable; reload the page to try again.</p>}
      <details className="document-preview"><summary>Preview original document</summary>{document.previewUrl ? document.mimeType === "application/pdf" ? <iframe src={document.previewUrl} title={`Preview of ${document.display_name}`} loading="lazy" /> : <Image src={document.previewUrl} alt={`Preview of ${document.display_name}`} width={1200} height={900} unoptimized style={{ width: "100%", height: "auto", maxHeight: 650, objectFit: "contain" }} /> : <p>Preview is unavailable. Reload the page to create a new private link.</p>}</details>
      <DocumentOCR patientId={patientId} documentId={document.id} documentName={document.display_name} mimeType={document.mimeType} downloadUrl={document.downloadUrl} canWrite={canWrite} extractions={document.extractions} />
    </article>)}</div>
      : documents.length ? <div className="account-empty-state"><Search size={22} /><strong>No matching documents</strong><span>Try a different name or type filter.</span></div>
        : <div className="account-empty-state"><FileText size={22} /><strong>No documents saved</strong><span>Only fictional files should be used in this prototype.</span></div>}
  </>;
}
