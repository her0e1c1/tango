/**
 * @file Verifies the "ConfigContainer auth identity" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "uses the confirmed
 * AuthContext UID for display and logout", "does not expose persisted identity while auth is
 * unconfirmed", "passes local account feedback and wrapped account actions to settings".
 */

import { render } from "@testing-library/react";
import type React from "react";
import type { User } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  authState: { status: "initializing" } as unknown,
  actions: {
    logout: vi.fn(),
    login: vi.fn(),
    configUpdate: vi.fn(),
    goToTop: vi.fn(),
    setDarkMode: vi.fn(),
    goByMenu: vi.fn(),
  },
  useConfigFormState: vi.fn((options: Record<string, unknown>) => options),
  accountOperations: {
    kind: "login" as "login" | "logout" | null,
    pending: true,
    error: null as unknown,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
  },
  useAccountOperations: vi.fn(),
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => mocks.authState }));
vi.mock("@/hooks/useActions", () => ({ useActions: () => mocks.actions }));
vi.mock("@/features/settings/hooks/useConfigFormState", () => ({
  useConfigFormState: mocks.useConfigFormState,
}));
vi.mock("@/features/settings/hooks/useAccountOperations", () => ({
  useAccountOperations: mocks.useAccountOperations,
}));
vi.mock("@/features/settings/components/templates/ConfigFormTemplate", () => ({
  ConfigFormTemplate: () => null,
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));

import { ConfigContainer } from "@/features/settings/containers/ConfigContainer";

describe("ConfigContainer auth identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig();
    mocks.authState = { status: "initializing" };
    mocks.accountOperations = {
      kind: "login",
      pending: true,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      retry: vi.fn().mockResolvedValue(undefined),
    };
    mocks.useAccountOperations.mockImplementation(() => mocks.accountOperations);
  });

  it("uses the confirmed AuthContext UID for display and logout", () => {
    const user = {
      uid: "confirmed-uid",
      isAnonymous: false,
      providerData: [{ displayName: "Confirmed User" }],
    } as User;
    mocks.authState = { status: "authenticated", uid: user.uid, user };

    render(<ConfigContainer />);

    const options = mocks.useConfigFormState.mock.calls[0]?.[0] as {
      identity: { uid: string; displayName: string | null };
      isLoggedIn: boolean;
      onLogout: () => unknown;
    };
    expect(options.identity).toEqual({
      uid: "confirmed-uid",
      displayName: "Confirmed User",
    });
    expect(options.isLoggedIn).toBe(true);
    options.onLogout();
    expect(mocks.accountOperations.logout).toHaveBeenCalledOnce();
  });

  it("does not expose persisted identity while auth is unconfirmed", () => {
    render(<ConfigContainer />);

    const options = mocks.useConfigFormState.mock.calls[0]?.[0] as {
      identity: { uid: string; displayName: string | null };
      isLoggedIn: boolean;
      onLogout?: () => unknown;
    };
    expect(options.identity).toEqual({ uid: "", displayName: null });
    expect(options.isLoggedIn).toBe(false);
    expect(options.onLogout).toBeUndefined();
  });

  it("passes local account feedback and wrapped account actions to settings", async () => {
    const user = {
      uid: "confirmed-uid",
      isAnonymous: false,
      providerData: [{ displayName: "Confirmed User" }],
    } as User;
    mocks.authState = { status: "authenticated", uid: user.uid, user };

    render(<ConfigContainer />);

    const dependencies = mocks.useAccountOperations.mock.calls[0]?.[0] as {
      generation: string;
      login: () => Promise<void>;
      logout: () => Promise<void>;
    };
    expect(dependencies.generation).toBe("authenticated:confirmed-uid:linked");
    expect(dependencies.login).toBe(mocks.actions.login);
    dependencies.logout();
    expect(mocks.actions.logout).toHaveBeenCalledWith("confirmed-uid");

    const options = mocks.useConfigFormState.mock.calls[0]?.[0] as {
      accountPending: boolean;
      accountFeedback: React.ReactElement<{
        pending: boolean;
        error: unknown;
        onRetry: () => void;
        pendingLabel: string;
        errorLabel: string;
      }>;
      onLogin: () => void;
      onLogout: () => void;
    };
    expect(options.accountPending).toBe(true);
    expect(options.accountFeedback.props).toMatchObject({
      pending: true,
      error: null,
      pendingLabel: "Signing in…",
      errorLabel: "Unable to sign in.",
    });
    options.onLogin();
    expect(mocks.accountOperations.login).toHaveBeenCalledOnce();
    options.onLogout();
    expect(mocks.accountOperations.logout).toHaveBeenCalledOnce();
    mocks.accountOperations.retry.mockRejectedValueOnce(new Error("retry failed"));
    expect(options.accountFeedback.props.onRetry()).toBeUndefined();
    await Promise.resolve();
    expect(mocks.accountOperations.retry).toHaveBeenCalledOnce();

    mocks.accountOperations.kind = "logout";
    render(<ConfigContainer />);
    const logoutOptions = mocks.useConfigFormState.mock.calls[1]?.[0] as typeof options;
    expect(logoutOptions.accountFeedback.props).toMatchObject({
      pendingLabel: "Signing out…",
      errorLabel: "Unable to sign out.",
    });
  });
});
