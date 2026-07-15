import { render } from "@testing-library/react";
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
}));

vi.mock("react-redux", () => ({ useSelector: () => mocks.config }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => mocks.authState }));
vi.mock("@/shared/hooks/useActions", () => ({ useActions: () => mocks.actions }));
vi.mock("@/features/settings/hooks/useConfigFormState", () => ({
  useConfigFormState: mocks.useConfigFormState,
}));
vi.mock("@/features/settings/components/templates/ConfigFormTemplate", () => ({
  ConfigFormTemplate: () => null,
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));

import { ConfigContainer } from "@/features/settings/containers/ConfigContainer";

describe("ConfigContainer auth identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({ uid: "persisted-uid", isAnonymous: false, displayName: "Persisted User" });
    mocks.authState = { status: "initializing" };
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
      config: ConfigState;
      isLoggedIn: boolean;
      onLogout: () => unknown;
    };
    expect(options.config).toMatchObject({
      uid: "confirmed-uid",
      isAnonymous: false,
      displayName: "Confirmed User",
    });
    expect(options.isLoggedIn).toBe(true);
    options.onLogout();
    expect(mocks.actions.logout).toHaveBeenCalledWith("confirmed-uid");
  });

  it("does not expose persisted identity while auth is unconfirmed", () => {
    render(<ConfigContainer />);

    const options = mocks.useConfigFormState.mock.calls[0]?.[0] as {
      config: ConfigState;
      isLoggedIn: boolean;
      onLogout?: () => unknown;
    };
    expect(options.config).toMatchObject({ uid: "", isAnonymous: true, displayName: null });
    expect(options.isLoggedIn).toBe(false);
    expect(options.onLogout).toBeUndefined();
  });
});
