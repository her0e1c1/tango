import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
  dismissToast: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("./signOut", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));
vi.mock("@/shared/ui/toast", () => ({ dismissToast: mocks.dismissToast, showToast: mocks.showToast }));

import { useSignOut } from "./useSignOut";

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("useSignOut", () => {
  beforeEach(() => {
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
    vi.mocked(dismissToast).mockReset();
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("reports a pending sign-out until the operation completes", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result } = renderHook(() => useSignOut());

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signOut();
    });

    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("offers a Toast action that dismisses and retries a failed sign-out", async () => {
    const failure = new Error("Sign-out failed");
    const retry = deferred<void>();
    mocks.signOutCurrentUser.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    const failureToast = vi.mocked(showToast).mock.calls[0]?.[0];
    if (failureToast === undefined) throw new Error("Sign-out failure Toast was not shown");
    expect(failureToast).toMatchObject({ message: "Unable to sign out.", tone: "error", action: { label: "Retry" } });

    act(() => {
      failureToast.action?.onClick();
    });

    expect(dismissToast).toHaveBeenCalledWith(1);
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("dismisses its failed sign-out Toast when its owner unmounts", async () => {
    const failure = new Error("Sign-out failed");
    mocks.signOutCurrentUser.mockRejectedValue(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(firstResult.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    unmount();

    expect(dismissToast).toHaveBeenCalledWith(1);
  });

  it("publishes a completed sign-out after its auth transition unmounts the owner", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useSignOut());
    let operation!: Promise<void>;

    act(() => {
      operation = result.current.signOut();
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });
});
