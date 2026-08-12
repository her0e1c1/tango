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
  login: vi.fn(async () => undefined),
  retry: vi.fn(async () => undefined),
}));

vi.mock("@/entities/session", () => ({ useSession: () => ({ status: "initializing" as const }) }));
vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
  updateConfig: mocks.updateConfig,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/settings/model/hooks/useAccountOperations", () => ({
  useAccountOperations: () => ({
    pending: false,
    error: null,
    kind: "login" as const,
    login: mocks.login,
    retry: mocks.retry,
  }),
}));
vi.mock("@/features/settings/model/hooks/useConfigFormState", () => ({
  useConfigFormState: () => ({}),
}));
vi.mock("@/features/settings/ui/components/ConfigForm", () => ({ ConfigForm: () => null }));

import { ConfigContainer } from "@/features/settings/ui/containers/ConfigContainer";

describe("ConfigContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({ appearance: { darkMode: false } });
  });

  it("navigates from the top shortcut and header actions", () => {
    render(<ConfigContainer login={vi.fn()} logout={vi.fn()} />);

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
