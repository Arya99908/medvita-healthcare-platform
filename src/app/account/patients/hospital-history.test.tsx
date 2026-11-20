import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HospitalHistory from "./hospital-history";

const baseProps = {
  patientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  lifeStage: "senior",
  visits: [{ id: "visit-1", visit_date: "2026-11-18T05:00:00.000Z", visit_type: "consultation", facility_name: "Fictional clinic", provider_name: "Dr. Fictional", notes: "Fictional visit note", visibility: "general" }],
  admissions: [{ id: "admission-1", admitted_at: "2026-11-10T02:30:00.000Z", discharged_at: "2026-11-12T08:30:00.000Z", facility_name: "Fictional hospital", summary: "Fictional discharge note", discharge_document_id: "doc-1", visibility: "general" }],
  documents: [{ id: "doc-1", display_name: "Fictional discharge summary.pdf", visibility: "general" }],
  canWrite: true,
  loadError: false,
};

describe("hospital history", () => {
  afterEach(cleanup);

  it("shows saved visits and admissions with their linked discharge file", () => {
    render(<HospitalHistory {...baseProps} />);
    expect(screen.getByText("Visits and hospital stays")).toBeTruthy();
    expect(screen.getByText("Fictional clinic")).toBeTruthy();
    expect(screen.getByText("Fictional hospital")).toBeTruthy();
    expect(screen.getByText("Discharge document: Fictional discharge summary.pdf")).toBeTruthy();
    expect(screen.getByText(/not independently verified/i)).toBeTruthy();
  });

  it("offers adolescent privacy controls and hides write forms for read-only users", () => {
    const { rerender } = render(<HospitalHistory {...baseProps} lifeStage="adolescent" />);
    expect(screen.getAllByLabelText("Privacy")).toHaveLength(2);
    rerender(<HospitalHistory {...baseProps} canWrite={false} />);
    expect(screen.queryByText("Add a hospital visit")).toBeNull();
    expect(screen.queryByText("Record a hospital stay")).toBeNull();
  });
});
