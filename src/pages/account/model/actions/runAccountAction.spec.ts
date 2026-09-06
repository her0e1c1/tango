import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";

import { accountPageStore } from "../store";
import { useAccountPageLifecycle } from "../useAccountPageLifecycle";
import { runAccountAction } from "./runAccountAction";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn<() => Promise<void>>(),
  signOut: vi.fn<() => Promise<void>>(),
  showToast: vi.fn(),
}));

vi.mock("./signIn", () => ({ signIn: mocks.signIn }));
vi.mock("./signOut", () => ({ signOut: mocks.signOut }));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

describe.each([
  ["signIn", "Signed in.", "Unable to sign in."],
  ["signOut", "Signed out.", "Unable to sign out."],
] as const)("ACCOUNT-01 ACCOUNT-02 ACCOUNT-03 runAccountAction %s", (operation, success, failure) => {
  const action = operation === "signIn" ? mocks.signIn : mocks.signOut;

  beforeEach(() => {
    accountPageStore.setState(accountPageStore.getInitialState());
    mocks.signIn.mockReset();
    mocks.signOut.mockReset();
    mocks.showToast.mockReset();
    action.mockResolvedValue(undefined);
  });

  it("does not start authentication without an active Account page", async () => {
    await expect(runAccountAction(operation)).resolves.toBeUndefined();

    expect(action).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
  });

  it("keeps the action pending when requested again before completion", async () => {
    const request = Promise.withResolvers<void>();
    action.mockReturnValue(request.promise);
    renderHook(useAccountPageLifecycle);

    const running = runAccountAction(operation);
    await runAccountAction(operation);

    expect(accountPageStore.getState().pageState[operation].pending).toBe(true);

    request.resolve();
    await running;

    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: success, tone: "success" });
  });

  it("allows a retry after handling an authentication failure", async () => {
    const retry = Promise.withResolvers<void>();
    action.mockRejectedValueOnce(new Error("Authentication failed")).mockReturnValueOnce(retry.promise);
    renderHook(useAccountPageLifecycle);

    await expect(runAccountAction(operation)).resolves.toBeUndefined();
    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
    expect(showToast).toHaveBeenCalledWith({ message: failure, tone: "error" });

    const running = runAccountAction(operation);
    expect(accountPageStore.getState().pageState[operation].pending).toBe(true);

    retry.resolve();
    await running;

    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: success, tone: "success" });
  });

  it("suppresses a failure that arrives after the page unmounts", async () => {
    const request = Promise.withResolvers<void>();
    action.mockReturnValue(request.promise);
    const { unmount } = renderHook(useAccountPageLifecycle);
    const running = runAccountAction(operation);

    unmount();
    request.reject(new Error("Late authentication failure"));
    await expect(running).resolves.toBeUndefined();

    expect(showToast).not.toHaveBeenCalled();
    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
  });

  it("publishes success after the auth transition unmounts the page", async () => {
    const request = Promise.withResolvers<void>();
    action.mockReturnValue(request.promise);
    const { unmount } = renderHook(useAccountPageLifecycle);
    const running = runAccountAction(operation);

    unmount();
    request.resolve();
    await running;

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: success, tone: "success" });
    expect(accountPageStore.getState().pageState[operation].pending).toBe(false);
  });
});
