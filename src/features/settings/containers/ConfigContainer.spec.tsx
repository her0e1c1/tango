/**
 * @file Verifies the Config Container navigation and header interaction contract.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConfigState } from "@/shared/config";
import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: null as unknown as ConfigState,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
  updateConfig: vi.fn(),
  useKey: vi.fn(),
  login: vi.fn(async () => undefined),
  retry: vi.fn(async () => undefined),
}));

vi.mock("@/action", () => ({ event: { loginGoogle: vi.fn(), logout: vi.fn() } }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ status: "initializing" as const }) }));
vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
  updateConfig: mocks.updateConfig,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("react-use", () => ({ useKey: mocks.useKey }));
vi.mock("@/features/settings/hooks/useAccountOperations", () => ({
  useAccountOperations: () => ({
    pending: false,
    error: null,
    kind: "login" as const,
    login: mocks.login,
    retry: mocks.retry,
  }),
}));
vi.mock("@/features/settings/hooks/useConfigFormState", () => ({
  useConfigFormState: () => ({}),
}));
vi.mock("@/features/settings/components/ConfigForm", () => ({ ConfigForm: () => null }));

import { ConfigContainer } from "@/features/settings/containers/ConfigContainer";

describe("ConfigContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({ appearance: { darkMode: false } });
  });

  it("preserves the top shortcut and forwards header actions", () => {
    render(<ConfigContainer />);

    const topShortcut = mocks.useKey.mock.calls.find(([key]) => key === "t")?.[1];
    topShortcut?.();
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
