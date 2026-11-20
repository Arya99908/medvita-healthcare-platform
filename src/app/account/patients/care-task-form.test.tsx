import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CareTaskForm, CareTaskStatusForm } from "./care-task-form";

vi.mock("./actions", () => ({ createCaregiverTask: vi.fn(), updateCaregiverTaskStatus: vi.fn() }));

describe("caregiver task assignment controls", () => {
  afterEach(() => cleanup());

  it("offers only the supplied active care team members as assignees", () => {
    render(<CareTaskForm patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" assignees={[
      { user_id: "22222222-2222-4222-8222-222222222222", relationship_role: "caregiver" },
    ]} />);
    expect(screen.getByRole("option", { name: "You" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /caregiver · account ending 2222/i })).toBeTruthy();
  });

  it("shows completion controls only to the assignee or task creator", () => {
    const { rerender } = render(<CareTaskStatusForm patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" taskId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" status="open" assignedTo="user-2" createdBy="user-1" currentUserId="user-3" canMarkMissed />);
    expect(screen.queryByRole("button", { name: /Mark complete/i })).toBeNull();
    rerender(<CareTaskStatusForm patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" taskId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" status="open" assignedTo="user-2" createdBy="user-1" currentUserId="user-2" canMarkMissed />);
    expect(screen.getByRole("button", { name: /Mark complete/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Mark missed/i })).toBeTruthy();
    rerender(<CareTaskStatusForm patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" taskId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" status="open" assignedTo="user-2" createdBy="user-1" currentUserId="user-2" canMarkMissed={false} />);
    expect(screen.queryByRole("button", { name: /Mark missed/i })).toBeNull();
  });
});
