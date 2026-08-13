import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  teardownRemoteReadSession: vi.fn(),
  teardownStudySession: vi.fn(),
  createStudySessionTeardown: vi.fn(),
}));

vi.mock("@/app/providers/remote-read/remoteReadSessionLifecycle", () => ({
  teardownRemoteReadSession: mocks.teardownRemoteReadSession,
}));
vi.mock("@/features/study", () => ({
  createStudySessionTeardown: mocks.createStudySessionTeardown,
}));

import { createSessionTeardown } from "./sessionLifecycle";

describe("application session lifecycle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createStudySessionTeardown.mockReturnValue(mocks.teardownStudySession);
  });

  it("finishes study teardown when remote read teardown fails", async () => {
    const cleanupError = new Error("remote cleanup failed");
    mocks.teardownRemoteReadSession.mockRejectedValue(cleanupError);

    await expect(createSessionTeardown()()).rejects.toBe(cleanupError);

    expect(mocks.teardownStudySession).toHaveBeenCalledOnce();
  });

  it("retries only unfinished teardown steps", async () => {
    const cleanupError = new Error("remote cleanup failed");
    mocks.teardownRemoteReadSession.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);
    const teardown = createSessionTeardown();

    await expect(teardown()).rejects.toBe(cleanupError);
    await expect(teardown()).resolves.toBeUndefined();

    expect(mocks.teardownRemoteReadSession).toHaveBeenCalledTimes(2);
    expect(mocks.teardownStudySession).toHaveBeenCalledOnce();
  });
});
