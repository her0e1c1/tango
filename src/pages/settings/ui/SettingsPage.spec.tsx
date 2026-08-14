import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { Preferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthSession: () => ({ status: "initializing" as const }) }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  updatePreferences: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/auth/sign-in", () => ({
  useSignIn: () => ({
    pending: false,
    error: null,
    signIn: vi.fn(async () => undefined),
  }),
}));
vi.mock("@/features/auth/sign-out", () => ({
  useSignOut: () => ({
    pending: false,
    error: null,
    signOut: vi.fn(async () => undefined),
  }),
}));
vi.mock("@/features/settings/model/hooks/usePreferencesFormState", () => ({
  usePreferencesFormState: () => ({}),
}));
vi.mock("@/features/settings/ui/components/PreferencesForm", () => ({ PreferencesForm: () => null }));

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
  });

  it("owns the route shortcut and renders in the application shell", () => {
    render(<SettingsPage login={vi.fn()} logout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    fireEvent.keyDown(window, { key: "t" });

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/");
  });
});
