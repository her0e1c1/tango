import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { useAuthAccount } from "@/entities/auth";
import type { Preferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

type AuthAccount = ReturnType<typeof useAuthAccount>;

const mocks = vi.hoisted(() => ({
  authAccount: undefined as AuthAccount,
  authUid: "",
  preferences: null as unknown as Preferences,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/auth", () => ({
  useAuthAccount: () => mocks.authAccount,
  useAuthUid: () => mocks.authUid,
}));
vi.mock("@/entities/preferences", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preferences")>()),
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  updatePreferences: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authAccount = undefined;
    mocks.authUid = "";
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
  });

  it("owns the route shortcut and renders in the application shell", () => {
    render(<SettingsPage login={vi.fn()} logout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    fireEvent.keyDown(window, { key: "t" });

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("displays an alert when sign-out fails and allows retrying sign-out", async () => {
    mocks.authAccount = { uid: "retry-uid-a", displayName: "Test User" };
    mocks.authUid = "retry-uid-a";
    const signOutError = new Error("sign out failed");
    const logout = vi.fn().mockRejectedValueOnce(signOutError).mockResolvedValueOnce(undefined);

    render(<SettingsPage login={vi.fn()} logout={logout} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
    expect(logout).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(logout).toHaveBeenCalledTimes(2);
  });
});
