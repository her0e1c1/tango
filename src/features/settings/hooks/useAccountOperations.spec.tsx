import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAccountOperations } from "@/features/settings/hooks/useAccountOperations";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

describe("useAccountOperations", () => {
  it("shares the login promise while login is pending", async () => {
    const request = deferred<void>();
    const login = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }));

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.login();
      second = result.current.login();
    });

    expect(first).toBe(second);
    expect(login).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await act(async () => {
      request.resolve();
      await first;
    });

    expect(result.current.pending).toBe(false);
  });

  it("shares the logout promise while logout is pending", async () => {
    const request = deferred<void>();
    const logout = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login: vi.fn(), logout }));

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.logout();
      second = result.current.logout();
    });

    expect(first).toBe(second);
    expect(logout).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "logout", pending: true, error: null });

    await act(async () => {
      request.resolve();
      await first;
    });

    expect(result.current.pending).toBe(false);
  });

  it("retries the failed operation", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAccountOperations({ login }));

    await act(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });

    expect(result.current).toMatchObject({ kind: "login", pending: false, error });

    await act(async () => {
      await expect(result.current.retry()).resolves.toBeUndefined();
    });

    expect(login).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ kind: "login", pending: false, error: null });
  });

  it("clears an earlier failure when a new attempt starts", async () => {
    const error = new Error("sign in failed");
    const request = deferred<void>();
    const login = vi.fn().mockRejectedValueOnce(error).mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }));

    await act(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);

    let retry!: Promise<void>;
    act(() => {
      retry = result.current.login();
    });

    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await act(async () => {
      request.resolve();
      await retry;
    });

    expect(result.current).toMatchObject({ kind: "login", pending: false, error: null });
  });
});
