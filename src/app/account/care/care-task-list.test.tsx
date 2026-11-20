import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CareTaskList, { type CareDashboardTask } from "./care-task-list";

vi.mock("../patients/actions", () => ({ updateCaregiverTaskStatus: vi.fn() }));

const tasks: CareDashboardTask[] = [
  { id: "task-open", patient_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "Prepare for appointment", due_at: "2026-11-21T08:00:00.000Z", status: "open", notes: null, assigned_to: "user-1", created_by: "user-2", patient_name: "Aarav" },
  { id: "task-overdue", patient_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Call the clinic", due_at: "2026-11-19T08:00:00.000Z", status: "open", notes: "Bring the report", assigned_to: "user-1", created_by: "user-2", patient_name: "Meera" },
  { id: "task-missed", patient_id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1", title: "Missed task", due_at: "2026-11-18T08:00:00.000Z", status: "missed", notes: null, assigned_to: "user-1", created_by: "user-2", patient_name: "Dev" },
];

describe("multi-profile care task dashboard", () => {
  afterEach(() => cleanup());

  it("shows assigned tasks, their profile links, and overdue status across profiles", () => {
    render(<CareTaskList tasks={tasks} currentUserId="user-1" selectedStatus="all" now={Date.parse("2026-11-20T08:00:00.000Z")} />);
    expect(screen.getByRole("heading", { name: "Prepare for appointment" })).toBeTruthy();
    expect(screen.getByText("Overdue")).toBeTruthy();
    expect(screen.getByText("Bring the report")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Aarav · Open profile" }).getAttribute("href")).toBe("/account/patients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(screen.getByText("Missed")).toBeTruthy();
  });

  it("filters the list to one task status", () => {
    render(<CareTaskList tasks={tasks} currentUserId="user-1" selectedStatus="missed" now={Date.parse("2026-11-20T08:00:00.000Z")} />);
    expect(screen.getByRole("heading", { name: "Missed task" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Prepare for appointment" })).toBeNull();
  });
});
