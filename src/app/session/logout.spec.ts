import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  teardownSession: vi.fn(),
  createSessionTeardown: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  signOutCurrentUser: mocks.signOutCurrentUser,
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("./sessionLifecycle", () => ({
  createSessionTeardown: mocks.createSessionTeardown,
}));

import { logout } from "./logout";

const isRetryableCleanupError = (error: unknown): error is Error & { retry: () => Promise<void> } =>
  error instanceof Error && "retry" in error && typeof error.retry === "function";

describe("logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.suspendAnonymousBootstrap.mockReturnValue(mocks.resumeAnonymousBootstrap);
    mocks.createSessionTeardown.mockReturnValue(mocks.teardownSession);
  });

  it("signs out before tearing down the application session", async () => {
    const operations: string[] = [];
    mocks.suspendAnonymousBootstrap.mockImplementation(() => {
      operations.push("suspend");
      return () => operations.push("resume");
    });
    mocks.signOutCurrentUser.mockImplementation(async () => {
      operations.push("sign-out");
    });
    mocks.teardownSession.mockImplementation(async () => {
      operations.push("teardown-session");
    });

    await logout();

    expect(operations).toEqual(["suspend", "sign-out", "teardown-session", "resume"]);
  });

  it("does not start session teardown when sign-out fails", async () => {
    mocks.signOutCurrentUser.mockRejectedValue(new Error("sign-out failed"));

    await expect(logout()).rejects.toThrow("sign-out failed");

    expect(mocks.teardownSession).not.toHaveBeenCalled();
    expect(mocks.resumeAnonymousBootstrap).toHaveBeenCalledOnce();
  });

  it("retries teardown without signing out again", async () => {
    const cleanupError = new Error("cleanup failed");
    mocks.teardownSession.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);

    const failure = await logout().catch((error: unknown) => error);
    expect(failure).toMatchObject({ originalError: cleanupError, retry: expect.any(Function) });
    if (!isRetryableCleanupError(failure)) throw new Error("Expected retryable cleanup failure");
    await failure.retry();

    expect(mocks.signOutCurrentUser).toHaveBeenCalledOnce();
    expect(mocks.teardownSession).toHaveBeenCalledTimes(2);
    expect(mocks.suspendAnonymousBootstrap).toHaveBeenCalledTimes(2);
    expect(mocks.resumeAnonymousBootstrap).toHaveBeenCalledTimes(2);
  });
});
