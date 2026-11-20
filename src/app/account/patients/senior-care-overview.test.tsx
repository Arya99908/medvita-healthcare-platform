import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SeniorCareOverview from "./senior-care-overview";

const props = {
  patientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  conditions: [{ name: "Fictional hypertension note", status: "active" }],
  tasks: [{ id: "task-today", title: "Fictional check-in task", status: "open", due_at: "2026-11-20T16:00:00.000Z" }],
  medications: [{ id: "med-1", medicine_name: "Fictional medicine note", status: "active" }],
  schedules: [{ medication_id: "med-1", frequency: "Twice daily as recorded", administration_times: ["08:00", "20:00"], status: "active" }],
  symptoms: [{ id: "symptom-1", symptom: "Fictional fatigue note", severity: 2, observed_at: "2026-11-19T10:00:00.000Z" }],
  appointments: [{ id: "appointment-1", title: "Fictional follow-up visit", event_type: "follow_up", status: "scheduled", starts_at: "2026-11-21T10:00:00.000Z" }],
  caregiverCount: 2,
  caregiverRoles: ["caregiver", "nurse"],
  alerts: [{ id: "alert-1", alert_type: "fictional_test_action", status: "created", created_at: "2026-11-19T12:00:00.000Z" }],
  loadErrors: { conditions: false, tasks: false, medications: false, symptoms: false, appointments: false, caregivers: false, alerts: false },
};

describe("senior care overview", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("summarizes saved senior records and selects local-day tasks and appointments", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T12:00:00.000Z"));
    render(<SeniorCareOverview {...props} />);

    expect(screen.getByText("1 condition note listed as current")).toBeTruthy();
    expect(screen.getByText("Fictional medicine note")).toBeTruthy();
    expect(screen.getByText("Fictional fatigue note")).toBeTruthy();
    expect(screen.getByText("2 linked care partners")).toBeTruthy();
    expect(screen.queryByText("Fictional check-in task")).not.toBeNull();
    expect(screen.getByText("Fictional follow-up visit")).toBeTruthy();
    expect(screen.getByText(/availability is not currently collected/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /emergency access/i }).getAttribute("href")).toBe(`/account/patients/${props.patientId}#patient-emergency-title`);
  });

  it("shows missing-data states instead of treating query failures as empty records", () => {
    render(<SeniorCareOverview {...props} loadErrors={{ ...props.loadErrors, tasks: true }} />);
    expect(screen.getByText("This information could not be loaded.")).toBeTruthy();
  });
});
