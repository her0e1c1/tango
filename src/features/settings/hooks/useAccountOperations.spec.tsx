import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

const StrictModeWrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;

afterEach(() => cleanup());

describe("useAccountOperations", () => {
  it("shares the login promise while login is pending", async () => {
    const request = deferred<void>();
    const login = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }), { wrapper: StrictModeWrapper });

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
    const { result } = renderHook(() => useAccountOperations({ login: vi.fn(), logout }), {
      wrapper: StrictModeWrapper,
    });

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

  it("discards a settled failure after Settings is left", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValue(error);
    const first = renderHook(() => useAccountOperations({ login, generation: "user-a" }), {
      wrapper: StrictModeWrapper,
    });

    await act(async () => {
      await expect(first.result.current.login()).rejects.toBe(error);
    });
    first.unmount();
    await act(async () => Promise.resolve());

    const next = renderHook(() => useAccountOperations({ login, generation: "user-a" }), {
      wrapper: StrictModeWrapper,
    });
    expect(next.result.current).toMatchObject({ kind: null, pending: false, error: null });
    await expect(next.result.current.retry()).resolves.toBeUndefined();
    expect(login).toHaveBeenCalledOnce();
  });

  it("discards settled feedback after an unrelated auth generation", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValue(error);
    const { result, rerender } = renderHook(({ generation }) => useAccountOperations({ login, generation }), {
      initialProps: { generation: "user-a" },
      wrapper: StrictModeWrapper,
    });

    await act(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });
    rerender({ generation: "user-b" });

    await waitFor(() => expect(result.current).toMatchObject({ kind: null, pending: false, error: null }));
    await expect(result.current.retry()).resolves.toBeUndefined();
    expect(login).toHaveBeenCalledOnce();
  });

  it("hands retryable logout cleanup to one auth-driven remount", async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const error = Object.assign(new Error("logout cleanup failed"), { retry });
    const logout = vi.fn().mockRejectedValue(error);
    const first = renderHook(() => useAccountOperations({ login: vi.fn(), logout, generation: "authenticated-user" }), {
      wrapper: StrictModeWrapper,
    });

    await act(async () => {
      await expect(first.result.current.logout()).rejects.toBe(error);
    });
    first.unmount();
    await act(async () => Promise.resolve());

    const anonymous = renderHook(
      () => useAccountOperations({ login: vi.fn(), logout: vi.fn(), generation: "anonymous-user" }),
      { wrapper: StrictModeWrapper }
    );
    expect(anonymous.result.current).toMatchObject({ kind: "logout", pending: false, error });

    anonymous.unmount();
    await act(async () => Promise.resolve());
    const later = renderHook(
      () => useAccountOperations({ login: vi.fn(), logout: vi.fn(), generation: "anonymous-user" }),
      { wrapper: StrictModeWrapper }
    );
    expect(later.result.current).toMatchObject({ kind: null, pending: false, error: null });
    expect(retry).not.toHaveBeenCalled();
  });
});
