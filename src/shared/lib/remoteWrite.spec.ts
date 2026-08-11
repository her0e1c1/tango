import { afterEach, describe, expect, it, vi } from "vitest";

import { RemoteWriteTimeoutError, waitForRemoteWrite } from "@/shared/lib/remoteWrite";

describe("waitForRemoteWrite", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a remote write result before the deadline", async () => {
    await expect(waitForRemoteWrite(Promise.resolve("saved"), "Deck update")).resolves.toBe("saved");
  });

  it("preserves a remote write failure", async () => {
    const failure = new Error("permission denied");

    await expect(waitForRemoteWrite(Promise.reject(failure), "Deck update")).rejects.toBe(failure);
  });

  it("rejects a stalled remote write at the deadline", async () => {
    vi.useFakeTimers();
    const operation = waitForRemoteWrite(new Promise(() => undefined), "Deck update", 1_000);
    const assertion = expect(operation).rejects.toEqual(new RemoteWriteTimeoutError("Deck update", 1_000));

    await vi.advanceTimersByTimeAsync(1_000);

    await assertion;
  });
});
