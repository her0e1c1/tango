/**
 * @file Verifies the "Auth transition controller" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "ignores persisted identity
 * until Firebase confirms a user", "starts remote reads from the confirmed Firebase UID", "does
 * not duplicate work when StrictMode replays the same auth effect".
 */

import type { User } from "firebase/auth";
import { describe, expect, it, vi } from "vitest";

import type { AuthState } from "@/auth/AuthContext";

vi.mock("@/query/cleanup", () => ({ cleanupFirestoreUid: vi.fn() }));
vi.mock("@/query/reads/remoteReadSession", () => ({ startRemoteReads: vi.fn() }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: vi.fn() }));

import { createAuthTransitionController } from "@/auth/AuthBootstrap";

/**
 * Provides the create user test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createUser = (
  uid: string,
  { isAnonymous = true, displayName = null }: { isAnonymous?: boolean; displayName?: string | null } = {}
) =>
  ({
    uid,
    isAnonymous,
    providerData: displayName == null ? [] : [{ displayName }],
  }) as User;

/**
 * Provides the authenticated test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const authenticated = (user: User): AuthState => ({ status: "authenticated", user, uid: user.uid });

/**
 * Provides the create dependencies test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createDependencies = () => ({
  cleanupUid: vi.fn(),
  subscribeUid: vi.fn(),
  reportError: vi.fn(),
});

describe("Auth transition controller", () => {
  it("ignores persisted identity until Firebase confirms a user", async () => {
    const dependencies = createDependencies();
    const controller = createAuthTransitionController(dependencies);
    const persistedConfig = { uid: "stale-uid", isAnonymous: false };

    await controller.transition({ status: "initializing" });

    expect(persistedConfig.uid).toBe("stale-uid");
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("starts remote reads from the confirmed Firebase UID", async () => {
    const dependencies = createDependencies();
    const user = createUser("uid-a");
    const controller = createAuthTransitionController(dependencies);

    await controller.transition(authenticated(user));

    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-a");
  });

  it("does not duplicate work when StrictMode replays the same auth effect", async () => {
    const dependencies = createDependencies();
    const state = authenticated(createUser("uid-a"));
    const controller = createAuthTransitionController(dependencies);

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
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    operations.length = 0;

    await controller.transition(authenticated(createUser("uid-b")));

    expect(operations).toEqual(["cleanup:uid-a", "subscribe:uid-b"]);
    expect(dependencies.cleanupUid).toHaveBeenCalledWith("uid-a");
  });

  it.each([
    { status: "signedOut" } as const,
    { status: "error", error: new Error("auth failed") } as const,
  ])("cleans the confirmed UID without subscribing for $status", async (state) => {
    const dependencies = createDependencies();
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    dependencies.cleanupUid.mockClear();
    dependencies.subscribeUid.mockClear();

    await controller.transition(state);

    expect(dependencies.cleanupUid).toHaveBeenCalledWith("uid-a");
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

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
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    dependencies.subscribeUid.mockClear();

    const transitionB = controller.transition(authenticated(createUser("uid-b")));
    await started;
    const transitionC = controller.transition(authenticated(createUser("uid-c")));
    finishCleanup();
    await Promise.all([transitionB, transitionC]);

    expect(dependencies.subscribeUid).not.toHaveBeenCalledWith("uid-b");
    expect(dependencies.subscribeUid).toHaveBeenCalledTimes(1);
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-c");
  });

  it("keeps same-UID metadata in Auth Context without cleanup or resubscription", async () => {
    const dependencies = createDependencies();
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    dependencies.cleanupUid.mockClear();
    dependencies.subscribeUid.mockClear();
    const linkedUser = createUser("uid-a", { isAnonymous: false, displayName: "Ada" });

    await controller.transition(authenticated(linkedUser));

    expect(dependencies.cleanupUid).not.toHaveBeenCalled();
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("detects metadata changed in place on the Firebase User object", async () => {
    const dependencies = createDependencies();
    const controller = createAuthTransitionController(dependencies);
    const user = createUser("uid-a");
    const mutableUser = user as unknown as {
      isAnonymous: boolean;
      providerData: Array<{ displayName: string | null }>;
    };
    await controller.transition(authenticated(user));
    dependencies.cleanupUid.mockClear();
    dependencies.subscribeUid.mockClear();

    mutableUser.isAnonymous = false;
    mutableUser.providerData = [{ displayName: "Ada" }];
    await controller.transition(authenticated(user));

    expect(dependencies.cleanupUid).not.toHaveBeenCalled();
    expect(dependencies.subscribeUid).not.toHaveBeenCalled();
  });

  it("retries the same transition after cleanup fails without forgetting the active UID", async () => {
    const cleanupError = new Error("cleanup failed");
    const dependencies = createDependencies();
    dependencies.cleanupUid.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    dependencies.subscribeUid.mockClear();
    const stateB = authenticated(createUser("uid-b"));

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
    const controller = createAuthTransitionController(dependencies);
    const state = authenticated(createUser("uid-a"));

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
    const controller = createAuthTransitionController(dependencies);
    await controller.transition(authenticated(createUser("uid-a")));
    dependencies.subscribeUid.mockClear();

    const transitionB = controller.transition(authenticated(createUser("uid-b")));
    await started;
    const transitionC = controller.transition(authenticated(createUser("uid-c")));
    rejectCleanup(cleanupError);
    await Promise.all([transitionB, transitionC]);

    expect(dependencies.reportError).toHaveBeenCalledWith(cleanupError);
    expect(dependencies.cleanupUid).toHaveBeenCalledTimes(2);
    expect(dependencies.subscribeUid).not.toHaveBeenCalledWith("uid-b");
    expect(dependencies.subscribeUid).toHaveBeenCalledWith("uid-c");
  });
});
