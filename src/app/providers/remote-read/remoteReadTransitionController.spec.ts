/**
 * @file Verifies the "Remote read transition controller" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "ignores persisted identity
 * until Firebase confirms a user", "starts remote reads from the confirmed Firebase UID", "does
 * not duplicate work when StrictMode replays the same auth effect".
 */

import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedSession, AuthSessionState } from "@/entities/auth-session";
import { createRemoteReadTransitionController } from "@/app/providers/remote-read/remoteReadTransitionController";

/**
 * Provides the create user test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createSession = (
  uid: string,
  { isAnonymous = true, displayName = null }: { isAnonymous?: boolean; displayName?: string | null } = {}
) => ({ uid, isAnonymous, displayName });

/**
 * Provides the authenticated test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const authenticated = (session: AuthenticatedSession): AuthSessionState => ({ status: "authenticated", ...session });

/**
 * Provides the create dependencies test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createDependencies = () => ({
  cleanupUid: vi.fn(),
  subscribeUid: vi.fn(),
  reportError: vi.fn(),
});

describe("Remote read transition controller", () => {
  it("ignores persisted identity until Firebase confirms a user", async () => {
    const dependencies = createDependencies();
    const controller = createRemoteReadTransitionController(dependencies);
    const persistedConfig = { uid: "stale-uid", isAnonymous: false };

    await controller.transition({ status: "initializing" });

    expect(persistedConfig.uid).toBe("stale-uid");
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("starts remote reads from the confirmed Firebase UID", async () => {
    const dependencies = createDependencies();
    const user = createSession("uid-a");
    const controller = createRemoteReadTransitionController(dependencies);

    await controller.transition(authenticated(user));

    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-a");
  });

  it("does not duplicate work when StrictMode replays the same auth effect", async () => {
    const dependencies = createDependencies();
    const state = authenticated(createSession("uid-a"));
    const controller = createRemoteReadTransitionController(dependencies);

    const first = controller.transition(state);
    const replay = controller.transition(state);
    await Promise.all([first, replay]);

    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(1);
  });

  it("cleans the previous UID before syncing and subscribing the replacement", async () => {
    const operations: string[] = [];
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockImplementation((uid) => operations.push(`cleanup:${uid}`));
    dependencies.subscribeUid.mockImplementation((uid) => operations.push(`subscribe:${uid}`));
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    operations.length = 0;

    await controller.transition(authenticated(createSession("uid-b")));

    expect(operations).toEqual(["cleanup:uid-a", "subscribe:uid-b"]);
    expect(dependencies.cleanupUid).toHaveBeenCalledWith("uid-a");
  });

  it.each([{ status: "signedOut" } as const, { status: "error", error: new Error("auth failed") } as const])(
    "cleans the confirmed UID without subscribing for $status",
    async (state) => {
      const dependencies = createDependencies();
      const controller = createRemoteReadTransitionController(dependencies);
      await controller.transition(authenticated(createSession("uid-a")));
      dependencies.cleanupUid.mockClear();
      dependencies.subscribeUid.mockClear();

      await controller.transition(state);

      expect(dependencies.cleanupUid).toHaveBeenCalledWith("uid-a");
      expect(dependencies.subscribeUid).not.toHaveBeenCalled();
    }
  );

  it("skips a stale intermediate UID during a rapid transition", async () => {
    let finishCleanup: () => void = () => undefined;
    let cleanupStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      cleanupStarted = resolve;
    });
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockImplementation(() => {
      cleanupStarted();
      return cleanup;
    });
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    dependencies.subscribeUid.mockClear();

    const transitionB = controller.transition(authenticated(createSession("uid-b")));
    await started;
    const transitionC = controller.transition(authenticated(createSession("uid-c")));
    finishCleanup();
    await Promise.all([transitionB, transitionC]);

    expect(dependencies.subscribeUid).not.toHaveBeenCalledWith("uid-b");
    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(1);
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-c");
  });

  it("resubscribes the original UID after a stale replacement cleans it up", async () => {
    let finishCleanup: () => void = () => undefined;
    let cleanupStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      cleanupStarted = resolve;
    });
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockImplementation(() => {
      cleanupStarted();
      return cleanup;
    });
    const controller = createRemoteReadTransitionController(dependencies);
    const stateA = authenticated(createSession("uid-a"));
    await controller.transition(stateA);
    dependencies.subscribeUid.mockClear();

    const transitionB = controller.transition(authenticated(createSession("uid-b")));
    await started;
    const transitionA = controller.transition(stateA);
    finishCleanup();
    await Promise.all([transitionB, transitionA]);

    expect(dependencies.cleanupUid).toHaveBeenCalledTimes(1);
    expect(dependencies.subscribeUid).not.toHaveBeenCalledWith("uid-b");
    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(1);
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-a");
  });

  it("keeps same-UID metadata without cleanup or resubscription", async () => {
    const dependencies = createDependencies();
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    dependencies.cleanupUid.mockClear();
    dependencies.subscribeUid.mockClear();
    const linkedUser = createSession("uid-a", { isAnonymous: false, displayName: "Ada" });

    await controller.transition(authenticated(linkedUser));

    expect(dependencies.cleanupUid).not.toHaveBeenCalled();
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("recognizes a new same-UID metadata snapshot", async () => {
    const dependencies = createDependencies();
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    dependencies.cleanupUid.mockClear();
    dependencies.subscribeUid.mockClear();

    await controller.transition(authenticated(createSession("uid-a", { isAnonymous: false, displayName: "Ada" })));

    expect(dependencies.cleanupUid).not.toHaveBeenCalled();
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("retries the same transition after cleanup fails without forgetting the active UID", async () => {
    const cleanupError = new Error("cleanup failed");
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    dependencies.subscribeUid.mockClear();
    const stateB = authenticated(createSession("uid-b"));

    const first = await controller.transition(stateB);
    const retry = await controller.transition(stateB);

    expect(first).toBe(false);
    expect(retry).toBe(true);
    expect(dependencies.cleanupUid).toHaveBeenNthCalledWith(1, "uid-a");
    expect(dependencies.cleanupUid).toHaveBeenNthCalledWith(2, "uid-a");
    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(1);
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-b");
  });

  it("retries a failed subscription once without duplicating the active listener", async () => {
    const subscribeError = new Error("subscribe failed");
    const dependencies = createDependencies();
    dependencies.subscribeUid.mockRejectedValueOnce(subscribeError).mockResolvedValueOnce(undefined);
    const controller = createRemoteReadTransitionController(dependencies);
    const state = authenticated(createSession("uid-a"));

    const first = await controller.transition(state);
    const retry = await controller.transition(state);
    const replay = await controller.transition(state);

    expect(first).toBe(false);
    expect(retry).toBe(true);
    expect(replay).toBe(true);
    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(2);
  });

  it("reports cleanup failures and still prevents a stale generation from subscribing", async () => {
    let rejectCleanup: (error: Error) => void = () => undefined;
    let cleanupStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      cleanupStarted = resolve;
    });
    const cleanup = new Promise<void>((_resolve, reject) => {
      rejectCleanup = reject;
    });
    const cleanupError = new Error("cleanup failed");
    const dependencies = createDependencies();
    dependencies.cleanupUid
      .mockImplementationOnce(() => {
        cleanupStarted();
        return cleanup;
      })
      .mockResolvedValueOnce(undefined);
    const controller = createRemoteReadTransitionController(dependencies);
    await controller.transition(authenticated(createSession("uid-a")));
    dependencies.subscribeUid.mockClear();

    const transitionB = controller.transition(authenticated(createSession("uid-b")));
    await started;
    const transitionC = controller.transition(authenticated(createSession("uid-c")));
    rejectCleanup(cleanupError);
    await Promise.all([transitionB, transitionC]);

    expect(dependencies.reportError).toHaveBeenCalledWith(cleanupError);
    expect(dependencies.cleanupUid).toHaveBeenCalledTimes(2);
    expect(dependencies.subscribeUid).not.toHaveBeenCalledWith("uid-b");
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-c");
  });
});
