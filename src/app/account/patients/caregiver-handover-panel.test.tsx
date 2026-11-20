import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CaregiverHandoverPanel from "./caregiver-handover-panel";

vi.mock("./actions", () => ({ createCaregiverHandover: vi.fn() }));

describe("caregiver handover panel", () => {
  afterEach(() => cleanup());

  it("offers active linked readers and labels saved handovers as point-in-time records", () => {
    render(<CaregiverHandoverPanel
      patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      currentUserId="11111111-1111-4111-8111-111111111111"
      lifeStage="adult"
      recipients={[
        { user_id: "11111111-1111-4111-8111-111111111111", relationship_role: "patient" },
        { user_id: "22222222-2222-4222-8222-222222222222", relationship_role: "caregiver" },
      ]}
      handovers={[{ id: "handover-1", from_user_id: "11111111-1111-4111-8111-111111111111", to_user_id: "22222222-2222-4222-8222-222222222222", handover_text: "Fictional handover summary", created_at: "2026-11-20T05:00:00.000Z" }]}
      canWrite
      loadError={false}
    />);

    expect(screen.getByRole("option", { name: /caregiver · account ending 2222/i })).toBeTruthy();
    expect(screen.getByText(/does not change access permissions or notify the recipient/i)).toBeTruthy();
    expect(screen.getByText(/Created by you · for caregiver · account ending 2222/i)).toBeTruthy();
    expect(screen.getByText("Fictional handover summary")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Create and save handover/i })).toBeTruthy();
  });
});
