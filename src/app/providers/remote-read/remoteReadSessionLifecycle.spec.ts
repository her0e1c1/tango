import { describe, expect, it, vi } from "vitest";

import { createRemoteReadSessionLifecycle } from "./remoteReadSessionLifecycle";

const authenticated = (uid: string) => ({
  status: "authenticated" as const,
  uid,
  isAnonymous: true,
  displayName: null,
});

const createDependencies = () => ({
  cleanupUid: vi.fn(),
  subscribeUid: vi.fn(),
  reportError: vi.fn(),
});

describe("remote read session lifecycle", () => {
  it("shares one teardown between logout and the signed-out transition", async () => {
    const dependencies = createDependencies();
    const lifecycle = createRemoteReadSessionLifecycle(dependencies);
    await lifecycle.transition(authenticated("uid-a"));

    await Promise.all([lifecycle.teardown(), lifecycle.transition({ status: "signedOut" })]);

    expect(dependencies.cleanupUid).toHaveBeenCalledExactlyOnceWith("uid-a");
  });

  it("propagates teardown failures and retries the active UID", async () => {
    const cleanupError = new Error("cleanup failed");
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);
    const lifecycle = createRemoteReadSessionLifecycle(dependencies);
    await lifecycle.transition(authenticated("uid-a"));

    await expect(lifecycle.teardown()).rejects.toBe(cleanupError);
    await expect(lifecycle.teardown()).resolves.toBeUndefined();

    expect(dependencies.cleanupUid).toHaveBeenCalledTimes(2);
    expect(dependencies.reportError).toHaveBeenCalledWith(cleanupError);
  });
});
