import { expect, it, describe, vi, beforeEach } from "vitest";

import * as type from "@/action/type";
import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({ eventLogout: vi.fn(() => ({ type: "LOGOUT" })) }));

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("@/action", () => ({ event: { logout: mocks.eventLogout } }));

import { logout, update, updateAll } from "@/action/config";

describe("config action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("should update", async () => {
    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = update("darkMode", true); // TODO: test other fields
    await f(dispatch, getState, undefined);
    expect(dispatch).lastCalledWith(type.configUpdate({ darkMode: true }));
  });

  it("updates persisted settings without an auth identity payload", async () => {
    const dispatch = vi.fn();
    const getState = vi.fn();
    const config = createConfig({ darkMode: true });

    await updateAll(config)(dispatch, getState, undefined);

    const updateAction = dispatch.mock.calls[0]?.[0] as ReturnType<typeof type.configUpdate>;
    expect(updateAction.payload.config).toEqual(config);
  });

  it("forwards the confirmed AuthContext UID to logout", async () => {
    const dispatch = vi.fn();
    const getState = vi.fn();

    await logout("confirmed-uid")(dispatch, getState, undefined);

    expect(mocks.eventLogout).toHaveBeenCalledWith("confirmed-uid");
    expect(dispatch).toHaveBeenCalledWith({ type: "LOGOUT" });
  });
});
