import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import MedVitaDashboard from "./medvita-dashboard";
import { DisplayPreferencesControl, DisplayPreferencesProvider } from "./display-preferences";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));

describe("MedVita fictional demo", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  function renderDashboard() {
    return render(<DisplayPreferencesProvider><DisplayPreferencesControl /><MedVitaDashboard /></DisplayPreferencesProvider>);
  }

  it("switches among life-stage profiles with the stage tabs", async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Aarav Sharma" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Teen girl" }));
    expect(screen.getByRole("heading", { name: "Mira Rao" })).toBeTruthy();
    expect(screen.getByText(/keeps sensitive notes private/i)).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Senior" }));
    expect(screen.getByRole("heading", { name: "Lakshmi Iyer" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Senior" }).getAttribute("aria-selected")).toBe("true");
  });

  it("saves notes locally and shows them in the selected profile timeline", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Add a health note" }));
    await user.type(screen.getByLabelText("What would you like to remember?"), "Sample note for the pitch");
    await user.click(screen.getByRole("button", { name: "Save sample note" }));

    expect(JSON.parse(window.localStorage.getItem("medvita-demo-notes") ?? "[]")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Health timeline" }));
    expect(screen.getByText("Sample note for the pitch")).toBeTruthy();
  });

  it("marks fictional medicine reminders without claiming a real dose", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("tab", { name: "Adult" }));
    await user.click(screen.getByRole("button", { name: "Medicines" }));
    await user.click(screen.getAllByRole("button", { name: "Mark sample taken" })[0]);

    expect(screen.getByRole("button", { name: "Sample marked taken" })).toBeTruthy();
    expect(screen.getByText(/Medication records in this prototype are fictional/i)).toBeTruthy();
  });

  it("supports keyboard stage navigation and text-size controls", async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard();
    const stageTabs = screen.getByRole("tablist", { name: "Choose fictional life-stage profile" });

    fireEvent.keyDown(stageTabs, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mira Rao" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Increase text size" }));
    expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.08");
    expect(container.querySelector(".stage-tab.active")?.textContent).toContain("Teen girl");
  });

  it("keeps display settings across page visits", async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await user.click(screen.getByRole("button", { name: "Increase text size" }));
    await user.click(screen.getByRole("button", { name: "High contrast Off" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("medvita-display-preferences") ?? "{}")).toEqual({ fontScale: 1.08, highContrast: true }));
    unmount();

    renderDashboard();
    await waitFor(() => expect(screen.getByText("108%")).toBeTruthy());
    expect(screen.getByRole("button", { name: "High contrast On" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.classList.contains("medvita-high-contrast")).toBe(true);
  });

  it("saves age-appropriate care logs as synthetic local demo data", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("tab", { name: "Infant" }));
    await user.click(screen.getByRole("button", { name: "Wellness" }));
    await user.type(screen.getByLabelText("Sample observation"), "Fictional feeding entry");
    await user.click(screen.getByRole("button", { name: "Save demo log" }));

    const entries = JSON.parse(window.localStorage.getItem("medvita-demo-care-logs") ?? "[]");
    expect(entries).toHaveLength(1);
    expect(entries[0].profileId).toBe("infant");
    expect(screen.getByText("Fictional feeding entry")).toBeTruthy();
    expect(screen.getByText(/Do not enter real health details/i)).toBeTruthy();
  });

  it("shows user-initiated emergency dialer choices without claiming dispatch", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Open emergency options" }));
    expect(screen.getByRole("heading", { name: "Need urgent help?" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open device dialer for 112" }).getAttribute("href")).toBe("tel:112");
    expect(screen.getByRole("link", { name: "Open device dialer for 108" }).getAttribute("href")).toBe("tel:108");
    expect(screen.getByText(/does not place the call or dispatch an ambulance/i)).toBeTruthy();
  });

  it("walks through role-based care access and saves a local handover sample", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Family & care team" }));
    expect(screen.getByRole("heading", { name: "One care circle, clear access" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Doctor" }));
    expect(screen.getByRole("heading", { name: "Doctor view" })).toBeTruthy();
    expect(screen.getByText(/patient grants that permission/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Platform admin" }));
    expect(screen.getByText(/No general patient-record access/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Patient" }));
    await user.type(screen.getByLabelText("What should the next care partner know?"), "Fictional handover note");
    await user.click(screen.getByRole("button", { name: "Save sample handover" }));
    expect(screen.getByText("Fictional handover note")).toBeTruthy();
    expect(screen.getByText(/Saved in this browser demo/i)).toBeTruthy();
    const task = screen.getByRole("button", { name: "Mark Prepare questions for the next visit done" });
    await user.click(task);
    expect(task.getAttribute("aria-pressed")).toBe("true");
  });
});
