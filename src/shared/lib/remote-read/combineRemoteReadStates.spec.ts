import { describe, expect, it, vi } from "vitest";

import { combineRemoteReadStates } from "@/shared/lib/remote-read/combineRemoteReadStates";

describe("combineRemoteReadStates", () => {
  it.each([
    { statuses: ["ready", "ready"] as const, expected: "ready" },
    { statuses: ["ready", "loading"] as const, expected: "loading" },
    { statuses: ["ready", "error"] as const, expected: "error" },
    { statuses: ["error", "blocked"] as const, expected: "blocked" },
    { statuses: ["idle", "idle"] as const, expected: "idle" },
  ])("combines $statuses as $expected", ({ statuses, expected }) => {
    const state = combineRemoteReadStates(...statuses.map((status) => ({ status, retry: vi.fn() })));

    expect(state.status).toBe(expected);
  });

  it("retries every failed read and leaves ready reads active", async () => {
    const failedRetry = vi.fn();
    const otherFailedRetry = vi.fn();
    const readyRetry = vi.fn();
    const state = combineRemoteReadStates(
      { status: "error", retry: failedRetry },
      { status: "error", retry: otherFailedRetry },
      { status: "ready", retry: readyRetry }
    );

    await state.retry();

    expect(failedRetry).toHaveBeenCalledOnce();
    expect(otherFailedRetry).toHaveBeenCalledOnce();
    expect(readyRetry).not.toHaveBeenCalled();
  });
});
