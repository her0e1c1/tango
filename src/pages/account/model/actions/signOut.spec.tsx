import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
  showToast: vi.fn(),
}));

vi.mock("./signOutCurrentUser", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

import { signOut } from "./signOut";
import { useAccountPageState } from "../useAccountPageState";

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("ACCOUNT-03 signOut", () => {
  beforeEach(() => {
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("keeps sign-out pending when requested again before completion", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result } = renderHook(() => useAccountPageState());

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = signOut(result.current.store, result.current.isMounted);
      duplicateOperation = signOut(result.current.store, result.current.isMounted);
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(result.current.pageState.signOut.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pageState.signOut.pending).toBe(false);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });

  it("allows the primary sign-out action to retry after a handled failure", async () => {
    const failure = new Error("Sign-out failed");
    const retry = deferred<void>();
    mocks.signOutCurrentUser.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useAccountPageState());

    await actAsync(async () => {
      await expect(signOut(result.current.store, result.current.isMounted)).resolves.toBeUndefined();
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign out.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = signOut(result.current.store, result.current.isMounted);
    });

    expect(result.current.pageState.signOut.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(result.current.pageState.signOut.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("publishes a completed sign-out after its auth transition unmounts the owner", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useAccountPageState());
    let operation!: Promise<void>;

    act(() => {
      operation = signOut(result.current.store, result.current.isMounted);
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });
});
