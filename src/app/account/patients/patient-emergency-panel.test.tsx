import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PatientEmergencyPanel from "./patient-emergency-panel";

vi.mock("./actions", () => ({
  createEmergencyContact: vi.fn(),
  deleteEmergencyContact: vi.fn(),
  recordEmergencyAlert: vi.fn(),
}));

describe("patient emergency panel", () => {
  afterEach(() => cleanup());

  it("shows profile emergency details and manual call links without implying dispatch", () => {
    render(<PatientEmergencyPanel
      patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      patientName="Fictional patient"
      dateOfBirth="1980-05-10"
      conditions={[{ id: "condition-1", label: "Fictional condition" }]}
      allergies={[{ id: "allergy-1", label: "Fictional allergen", detail: "Fictional reaction" }]}
      medications={[{ id: "medication-1", label: "Fictional medicine", detail: "10 mg" }]}
      contacts={[{ id: "contact-1", display_name: "Fictional caregiver", relationship: "Family", phone: "+91 98765 43210", priority: 1 }]}
      alerts={[]}
      canWrite={false}
      contactsError={false}
      alertsError={false}
      summaryError={false}
    />);

    expect(screen.getByText("Fictional condition")).toBeTruthy();
    expect(screen.getByText("Fictional allergen (Fictional reaction)")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Call" }).getAttribute("href")).toBe("tel:+919876543210");
    expect(screen.getByRole("link", { name: "Open dialer for 112" }).getAttribute("href")).toBe("tel:112");
    expect(screen.getByRole("link", { name: "Open dialer for 108" }).getAttribute("href")).toBe("tel:108");
    expect(screen.getByText(/cannot dispatch an ambulance or notify contacts/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Record ambulance/i })).toBeNull();
  });
});
