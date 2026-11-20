import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClinicalNoteForm from "./clinical-note-form";

vi.mock("./patient-actions", () => ({ createClinicalNote: vi.fn() }));

describe("clinician note form", () => {
  afterEach(() => cleanup());

  it("labels notes as clinician-authored and offers addenda to correct an earlier note", () => {
    render(<ClinicalNoteForm patientId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" notes={[
      { id: "note-1", title: "Consultation", created_at: "2026-11-20T10:00:00.000Z" },
    ]} />);
    expect(screen.getByText(/append a dated clinician-authored consultation/i)).toBeTruthy();
    expect(screen.getByRole("option", { name: "Correction or addendum" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Consultation ·/ })).toBeTruthy();
    expect(screen.getByText(/corrections are recorded as addenda/i)).toBeTruthy();
  });
});
