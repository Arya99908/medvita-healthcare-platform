import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountDeletionPanel from "./deletion-request-panel";

vi.mock("./deletion-actions", () => ({ requestAccountDeletion: vi.fn(), withdrawAccountDeletionRequest: vi.fn() }));

describe("account deletion request panel", () => {
  afterEach(() => cleanup());

  it("requires a current password and clearly explains that a request is not deletion", () => {
    render(<AccountDeletionPanel requests={[]} loadError={false} />);
    expect(screen.getByLabelText("Current password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm identity and request review" })).toBeTruthy();
    expect(screen.getByText(/does not immediately delete your account or health records/i)).toBeTruthy();
  });

  it("shows a pending status and a withdrawal control without presenting it as completed", () => {
    render(<AccountDeletionPanel requests={[{ id: "request-1", requested_at: "2026-11-20T10:00:00.000Z", status: "requested", review_note: null }]} loadError={false} />);
    expect(screen.getByText("Waiting for review", { selector: "strong" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Withdraw request" })).toBeTruthy();
    expect(screen.queryByLabelText("Current password")).toBeNull();
  });
});
