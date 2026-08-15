import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { useAuthSession } from "@/entities/auth";
import type { Preferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

type AuthSessionState = ReturnType<typeof useAuthSession>;

const mocks = vi.hoisted(() => ({
  authSession: { status: "initializing" } as AuthSessionState,
  preferences: null as unknown as Preferences,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/auth", () => ({
  useAuthSession: () => mocks.authSession,
  useAuthUid: () => (mocks.authSession.status === "authenticated" ? mocks.authSession.uid : ""),
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  updatePreferences: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authSession = { status: "initializing" };
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
  });

  it("owns the route shortcut and renders in the application shell", () => {
    render(<SettingsPage login={vi.fn()} logout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    fireEvent.keyDown(window, { key: "t" });

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("composes account, preferences, and page metadata", () => {
    mocks.authSession = {
      status: "authenticated",
      uid: "retry-uid-a",
      isAnonymous: false,
      displayName: "Test User",
    };
    render(<SettingsPage login={vi.fn()} logout={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Account" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Appearance" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Study" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Advanced" })).toHaveTextContent("retry-uid-a");
  });
});
