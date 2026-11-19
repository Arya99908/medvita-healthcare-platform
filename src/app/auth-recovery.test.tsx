import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import ResetPasswordPage from "./reset-password/page";
import UpdatePasswordPage from "./update-password/page";

const { auth, routerPush } = vi.hoisted(() => ({
  auth: {
    resetPasswordForEmail: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
  routerPush: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush, refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth }),
  hasSupabaseConfig: () => true,
}));

describe("password recovery", () => {
  beforeEach(() => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    auth.updateUser.mockResolvedValue({ error: null });
  });
  afterEach(() => cleanup());

  it("sends a reset link without revealing whether the email has an account", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText("Email address"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    }));
    expect(screen.getByText(/if an account uses that email address/i)).toBeTruthy();
  });

  it("requires matching passwords before calling the update API", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await screen.findByLabelText("New password");

    await user.type(screen.getByLabelText("New password"), "correct-horse-1");
    await user.type(screen.getByLabelText("Confirm new password"), "different-horse-1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText("The passwords do not match.")).toBeTruthy();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates a password only after the reset session is present", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await screen.findByLabelText("New password");

    await user.type(screen.getByLabelText("New password"), "correct-horse-1");
    await user.type(screen.getByLabelText("Confirm new password"), "correct-horse-1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "correct-horse-1" }));
    expect(screen.getByText("Your password has been updated.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Continue to your account" }));
    expect(routerPush).toHaveBeenCalledWith("/account");
  });

  it("does not show password fields without the recovery session", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    render(<UpdatePasswordPage />);

    expect(await screen.findByText("Reset link unavailable or expired")).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
});
