import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { ConfigState } from "@/shared/config";
import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: null as unknown as ConfigState,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth-session", () => ({ useAuthSession: () => ({ status: "initializing" as const }) }));
vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
  updateConfig: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/auth/sign-in", () => ({
  useSignIn: () => ({
    pending: false,
    error: null,
    signIn: vi.fn(async () => undefined),
    retry: vi.fn(async () => undefined),
  }),
}));
vi.mock("@/features/auth/sign-out", () => ({
  useSignOut: () => ({
    pending: false,
    error: null,
    signOut: vi.fn(async () => undefined),
    retry: vi.fn(async () => undefined),
  }),
}));
vi.mock("@/features/settings/model/hooks/useConfigFormState", () => ({
  useConfigFormState: () => ({}),
}));
vi.mock("@/features/settings/ui/components/ConfigForm", () => ({ ConfigForm: () => null }));

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({ appearance: { darkMode: false } });
  });

  it("owns the route shortcut and application header", () => {
    render(<SettingsPage login={vi.fn()} logout={vi.fn()} />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Import decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, "/import");
    expect(mocks.navigate).toHaveBeenNthCalledWith(4, "/settings");
  });
});
