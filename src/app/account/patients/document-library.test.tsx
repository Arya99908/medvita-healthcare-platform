import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentLibrary from "./document-library";

vi.mock("./document-ocr", () => ({ default: () => <div>OCR tools</div> }));

const documents = [
  { id: "doc-1", display_name: "Care plan", document_type: "care_summary", document_date: "2026-11-02", verification_status: "unverified", uploaded_by: "user-a", mimeType: "application/pdf", downloadUrl: "/private/care", previewUrl: "/private/care-preview", canDelete: false, extractions: [] },
  { id: "doc-2", display_name: "Blood panel", document_type: "test_result", document_date: "2026-10-12", verification_status: "unverified", uploaded_by: "user-a", mimeType: "image/png", downloadUrl: "/private/test", previewUrl: "/private/test-preview", canDelete: false, extractions: [] },
];

describe("private document library", () => {
  afterEach(() => cleanup());

  it("searches only documents supplied for the authorized profile", () => {
    render(<DocumentLibrary patientId="patient-a" documents={documents} canWrite={false} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Find a document" }), { target: { value: "care" } });
    expect(screen.getByRole("heading", { name: "Care plan" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Blood panel" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Showing 1 of 2 documents");
  });

  it("filters by document type and reports when no results match", () => {
    render(<DocumentLibrary patientId="patient-a" documents={documents} canWrite={false} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "test_result" } });
    expect(screen.getByRole("heading", { name: "Blood panel" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Care plan" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Find a document" }), { target: { value: "missing" } });
    expect(screen.getByText("No matching documents")).toBeTruthy();
  });

  it("shows an empty message before documents exist", () => {
    render(<DocumentLibrary patientId="patient-a" documents={[]} canWrite={false} />);
    expect(screen.getByText("No documents saved")).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});
