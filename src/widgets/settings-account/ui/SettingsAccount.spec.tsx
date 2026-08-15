import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { useAuthSession } from "@/entities/auth";

type AuthSessionState = ReturnType<typeof useAuthSession>;

const mocks = vi.hoisted(() => ({
  authSession: { status: "initializing" } as AuthSessionState,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.authSession }));

import { SettingsAccount } from "./SettingsAccount";

describe("SettingsAccount", () => {
  beforeEach(() => {
    mocks.authSession = { status: "initializing" };
  });

  it("signs in when the current user is not linked", async () => {
    const login = vi.fn().mockResolvedValue(undefined);

    render(<SettingsAccount login={login} logout={vi.fn()} />);

    expect(screen.getByText("Google Login")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(login).toHaveBeenCalledOnce();
  });

  it("signs out when the current user is linked", async () => {
    mocks.authSession = {
      status: "authenticated",
      uid: "linked-user",
      isAnonymous: false,
      displayName: "Settings User",
    };
    const logout = vi.fn().mockResolvedValue(undefined);

    render(<SettingsAccount login={vi.fn()} logout={logout} />);

    expect(screen.getByText("Settings User")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it("shows pending feedback while the account operation is running", async () => {
    let resolveLogin: (() => void) | undefined;
    const login = vi.fn(() => new Promise<void>((resolve) => (resolveLogin = resolve)));

    render(<SettingsAccount login={login} logout={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Signing in…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
    resolveLogin?.();
    await waitFor(() => expect(screen.queryByText("Signing in…")).not.toBeInTheDocument());
  });

  it("displays an error and retries the active operation", async () => {
    const login = vi.fn().mockRejectedValueOnce(new Error("sign in failed")).mockResolvedValueOnce(undefined);

    render(<SettingsAccount login={login} logout={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(login).toHaveBeenCalledTimes(2);
  });
});
