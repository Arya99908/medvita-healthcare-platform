import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InvitationPanel from "./invitation-panel";

vi.mock("./actions", () => ({ createPatientInvitation: vi.fn(), revokePatientInvitation: vi.fn(), revokePatientRelationship: vi.fn() }));

describe("caregiver invitation panel", () => {
  afterEach(() => cleanup());

  it("offers role and least-privilege choices and exposes linked access controls", () => {
    render(<InvitationPanel patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" invitations={[]} relationships={[
      { id: "relationship-1", user_id: "22222222-2222-4222-8222-222222222222", relationship_role: "caregiver", can_write: false },
    ]} loadError={false} />);
    expect(screen.getByLabelText("Their email address")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Family member" })).toBeTruthy();
    expect(screen.getByLabelText(/Allow them to add and update care records/)).toBeTruthy();
    expect(screen.getByText(/works only for the invited, email-confirmed account/i)).toBeTruthy();
    expect(screen.getByText(/caregiver · account ending 2222/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove access" })).toBeTruthy();
  });
});
