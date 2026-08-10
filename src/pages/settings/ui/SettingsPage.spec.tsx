import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  retry: vi.fn(),
  useKey: vi.fn(),
  goToTop: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ status: "unauthenticated" as const }) }));
vi.mock("@/features/settings", async () => {
  const [{ ConfigForm }, { useConfigFormState }] = await Promise.all([
    vi.importActual<typeof import("@/features/settings/components/ConfigForm")>(
      "@/features/settings/components/ConfigForm"
    ),
    vi.importActual<typeof import("@/features/settings/hooks/useConfigFormState")>(
      "@/features/settings/hooks/useConfigFormState"
    ),
  ]);
  return {
    ConfigForm,
    useConfigFormState,
    useAccountOperations: () => ({
      login: mocks.login,
      logout: vi.fn(),
      retry: mocks.retry,
      pending: false,
      error: null,
      kind: undefined,
    }),
  };
});
vi.mock("@/hooks/useConfig", () => ({ useConfig: () => createConfig() }));
vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    configUpdate: vi.fn(),
    setDarkMode: vi.fn(),
    goToTop: mocks.goToTop,
    goToImport: vi.fn(),
    goToSettings: vi.fn(),
  }),
}));
vi.mock("react-use", () => ({ useKey: mocks.useKey }));

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it("composes settings and account actions", async () => {
    const view = render(<SettingsPage />);

    expect(view.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    await userEvent.click(view.getByRole("button", { name: "Login" }));
    expect(mocks.login).toHaveBeenCalledOnce();
    expect(mocks.useKey).toHaveBeenCalledWith("t", mocks.goToTop);
  });
});
