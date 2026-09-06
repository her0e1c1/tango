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
import { useAccountActionState } from "../useAccountActionState";

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

  it("reports a pending sign-out until the operation completes", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result } = renderHook(() => useAccountActionState());

    let operation!: Promise<void>;
    act(() => {
      operation = signOut(result.current);
    });

    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("allows the primary sign-out action to retry after a handled failure", async () => {
    const failure = new Error("Sign-out failed");
    const retry = deferred<void>();
    mocks.signOutCurrentUser.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useAccountActionState());

    await actAsync(async () => {
      await expect(signOut(result.current)).rejects.toThrow("Sign-out failed");
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign out.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = signOut(result.current);
    });

    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("publishes a completed sign-out after its auth transition unmounts the owner", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useAccountActionState());
    let operation!: Promise<void>;

    act(() => {
      operation = signOut(result.current);
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });
});
