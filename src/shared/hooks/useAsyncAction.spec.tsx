import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { actAsync } from "@/test/act";

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
};

describe("useAsyncAction", () => {
  it("keeps an earlier failure retryable when a later unrelated operation succeeds", async () => {
    const firstAttempt = deferred<void>();
    const laterOperation = deferred<void>();
    const failure = new Error("first failed");
    const firstTask = vi.fn().mockReturnValueOnce(firstAttempt.promise).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAsyncAction<string>("uid-a"));

    let first!: Promise<void>;
    let later!: Promise<void>;
    act(() => {
      first = result.current.run(["first"], "update:first", firstTask);
      later = result.current.run(["later"], "update:later", () => laterOperation.promise);
    });

    await actAsync(async () => {
      firstAttempt.reject(failure);
      await expect(first).rejects.toBe(failure);
      laterOperation.resolve();
      await later;
    });

    expect(result.current.error).toBe(failure);
    act(() => result.current.retry());
    await waitFor(() => {
      expect(firstTask).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("keeps a failure after an unrelated operation starts and succeeds", async () => {
    const failure = new Error("first failed");
    const firstTask = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const unrelatedTask = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAsyncAction<string>("uid-a"));

    await actAsync(async () => {
      await expect(result.current.run(["first"], "update:first", firstTask)).rejects.toBe(failure);
    });
    expect(result.current.error).toBe(failure);

    await actAsync(async () => {
      await result.current.run(["later"], "update:later", unrelatedTask);
    });

    expect(result.current.error).toBe(failure);
    act(() => result.current.retry());
    await waitFor(() => {
      expect(firstTask).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });
});
