import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LaboratoryResults from "./laboratory-results";

const props = {
  patientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  lifeStage: "adult",
  results: [{ id: "result-1", test_name: "Fictional panel", value_text: "5.4", unit: "mmol/L", reference_range: "As printed: 4.0 to 6.0", result_date: "2026-11-19", document_id: "doc-1", verification_status: "unverified", visibility: "general" }],
  documents: [{ id: "doc-1", display_name: "Fictional report.pdf", visibility: "general", document_type: "test_result" }],
  canWrite: true,
  loadError: false,
};

describe("laboratory results", () => {
  afterEach(cleanup);

  it("shows the recorded value and range without interpreting them", () => {
    render(<LaboratoryResults {...props} />);
    expect(screen.getByText("Fictional panel")).toBeTruthy();
    expect(screen.getByText("Result entered: 5.4 mmol/L")).toBeTruthy();
    expect(screen.getByText("Reference range entered: As printed: 4.0 to 6.0")).toBeTruthy();
    expect(screen.getByText("Report file: Fictional report.pdf")).toBeTruthy();
    expect(screen.getByText(/does not flag or interpret/i)).toBeTruthy();
  });

  it("shows adolescent privacy controls and removes entry form for read-only users", () => {
    const { rerender } = render(<LaboratoryResults {...props} lifeStage="adolescent" />);
    expect(screen.getByLabelText("Privacy")).toBeTruthy();
    rerender(<LaboratoryResults {...props} canWrite={false} />);
    expect(screen.queryByText("Add a laboratory result")).toBeNull();
  });
});
