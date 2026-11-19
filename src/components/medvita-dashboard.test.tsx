import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import MedVitaDashboard from "./medvita-dashboard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));

describe("MedVita fictional demo", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("switches among life-stage profiles with the stage tabs", async () => {
    const user = userEvent.setup();
    render(<MedVitaDashboard />);

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
    render(<MedVitaDashboard />);

    await user.click(screen.getByRole("button", { name: "Add a health note" }));
    await user.type(screen.getByLabelText("What would you like to remember?"), "Sample note for the pitch");
    await user.click(screen.getByRole("button", { name: "Save sample note" }));

    expect(JSON.parse(window.localStorage.getItem("medvita-demo-notes") ?? "[]")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Health timeline" }));
    expect(screen.getByText("Sample note for the pitch")).toBeTruthy();
  });

  it("marks fictional medicine reminders without claiming a real dose", async () => {
    const user = userEvent.setup();
    render(<MedVitaDashboard />);

    await user.click(screen.getByRole("tab", { name: "Adult" }));
    await user.click(screen.getByRole("button", { name: "Medicines" }));
    await user.click(screen.getAllByRole("button", { name: "Mark sample taken" })[0]);

    expect(screen.getByRole("button", { name: "Sample marked taken" })).toBeTruthy();
    expect(screen.getByText(/Medication records in this prototype are fictional/i)).toBeTruthy();
  });

  it("supports keyboard stage navigation and text-size controls", async () => {
    const user = userEvent.setup();
    const { container } = render(<MedVitaDashboard />);
    const stageTabs = screen.getByRole("tablist", { name: "Choose fictional life-stage profile" });

    fireEvent.keyDown(stageTabs, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mira Rao" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Increase text size" }));
    expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.08");
    expect(container.querySelector(".stage-tab.active")?.textContent).toContain("Teen girl");
  });
});
