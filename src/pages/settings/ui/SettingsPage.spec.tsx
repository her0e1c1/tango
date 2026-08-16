import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

import { SettingsPage } from "./SettingsPage";

const renderPage = (logout = vi.fn(), login = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={["/settings"]}>
      <Routes>
        <Route path="/" element={<h1>Deck list</h1>} />
        <Route path="/settings" element={<SettingsPage login={login} logout={logout} />} />
      </Routes>
    </MemoryRouter>
  );

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authAccount = undefined;
    mocks.authUid = "";
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
  });

  it("navigates to the deck list from the route shortcut", async () => {
    renderPage();

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("displays an alert when sign-out fails and clears it after retrying", async () => {
    mocks.authAccount = { uid: "retry-uid-a", displayName: "Test User" };
    mocks.authUid = "retry-uid-a";
    const logout = vi.fn().mockRejectedValueOnce(new Error("sign out failed")).mockResolvedValueOnce(undefined);
    renderPage(logout);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
