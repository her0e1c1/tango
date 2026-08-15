import type { useAuthAccount } from "@/entities/auth";
import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createPreferences } from "@/test/factories";

type AuthAccount = ReturnType<typeof useAuthAccount>;

const mocks = vi.hoisted(() => ({
  authAccount: undefined as AuthAccount,
  authUid: "",
  preferences: null as unknown as Preferences,
  updatePreferences: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/auth", () => ({
  useAuthAccount: () => mocks.authAccount,
  useAuthUid: () => mocks.authUid,
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  updatePreferences: mocks.updatePreferences,
}));

import { SettingsContainer } from "./SettingsContainer";

describe("SettingsContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authAccount = undefined;
    mocks.authUid = "";
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
  });

  it("connects account sign-in and preference updates", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    render(<SettingsContainer login={login} logout={vi.fn()} version="1.2.3" />);

    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(login).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("checkbox", { name: "Show header" }));
    await waitFor(() => {
      expect(mocks.updatePreferences).toHaveBeenLastCalledWith({
        ...mocks.preferences,
        appearance: { ...mocks.preferences.appearance, showHeader: !mocks.preferences.appearance.showHeader },
      });
    });
  });

  it("displays an alert when sign-out fails and allows retrying sign-out", async () => {
    mocks.authAccount = { uid: "retry-uid-a", displayName: "Test User" };
    mocks.authUid = "retry-uid-a";
    const signOutError = new Error("sign out failed");
    const logout = vi.fn().mockRejectedValueOnce(signOutError).mockResolvedValueOnce(undefined);

    render(<SettingsContainer login={vi.fn()} logout={logout} version="1.2.3" />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
    expect(logout).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(logout).toHaveBeenCalledTimes(2);
  });
});
