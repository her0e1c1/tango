import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthSessionStore } from "@/entities/auth-session";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInAnonymously: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: singletonMocks.auth }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: singletonMocks.onAuthStateChanged,
  signInAnonymously: singletonMocks.signInAnonymously,
}));

import { createAuthController } from "./authController";

const createUser = (
  uid: string,
  { isAnonymous = true, displayName = null }: { isAnonymous?: boolean; displayName?: string | null } = {}
) =>
  ({
    uid,
    isAnonymous,
    providerData: displayName == null ? [] : [{ displayName }],
  }) as User;

const createHarness = (signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined))) => {
  let publishUser: (user: User | null) => void = () => undefined;
  let publishError: (error: unknown) => void = () => undefined;
  const stopObserver = vi.fn();
  const onAuthStateChanged = vi.fn((_auth, onUser, onError) => {
    publishUser = onUser;
    publishError = onError;
    return stopObserver;
  });
  const sessionStore = createAuthSessionStore();
  const controller = createAuthController({
    auth: {} as Auth,
    authSessionStore: sessionStore,
    onAuthStateChanged,
    signInAnonymously,
  });
  controller.start();
  return { controller, onAuthStateChanged, publishError, publishUser, sessionStore, stopObserver };
};

describe("authController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts one app-lifetime observer and disposes it once", () => {
    const harness = createHarness();

    harness.controller.start();
    harness.controller.dispose();
    harness.controller.dispose();

    expect(harness.onAuthStateChanged).toHaveBeenCalledOnce();
    expect(harness.stopObserver).toHaveBeenCalledOnce();
  });

  it("maps Firebase users to a Firebase-independent session snapshot", () => {
    const { publishUser, sessionStore } = createHarness();

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(sessionStore.getSnapshot()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("starts anonymous sign-in once for duplicate signed-out callbacks", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser, sessionStore } = createHarness(signInAnonymously);

    publishUser(null);
    publishUser(null);

    expect(sessionStore.getSnapshot()).toEqual({ status: "signedOut" });
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("waits for every bootstrap suspension to be released", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { controller, publishUser } = createHarness(signInAnonymously);
    const resumeFirst = controller.suspendAnonymousBootstrap();
    const resumeSecond = controller.suspendAnonymousBootstrap();
    publishUser(null);

    resumeFirst();
    resumeFirst();
    expect(signInAnonymously).not.toHaveBeenCalled();

    resumeSecond();
    resumeSecond();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("does not bootstrap anonymously when authentication returns before release", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { controller, publishUser } = createHarness(signInAnonymously);
    const resume = controller.suspendAnonymousBootstrap();

    publishUser(null);
    publishUser(createUser("uid-a"));
    resume();

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("starts a new anonymous episode after an authenticated user signs out", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = createHarness(signInAnonymously);

    publishUser(null);
    publishUser(createUser("uid-a"));
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it("publishes observer and anonymous sign-in failures without an identity", async () => {
    const anonymousError = new Error("anonymous sign-in failed");
    const { publishError, publishUser, sessionStore } = createHarness(vi.fn().mockRejectedValue(anonymousError));
    const observerError = new Error("observer failed");

    publishError(observerError);
    expect(sessionStore.getSnapshot()).toEqual({ status: "error", error: observerError });
    publishUser(null);

    await vi.waitFor(() => expect(sessionStore.getSnapshot()).toEqual({ status: "error", error: anonymousError }));
  });

  it("ignores a stale anonymous sign-in failure after authentication succeeds", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { publishUser, sessionStore } = createHarness(vi.fn(() => signInAttempt));

    publishUser(null);
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(sessionStore.getSnapshot()).toMatchObject({ status: "authenticated", uid: "uid-a" });
  });

  it("publishes synchronous setup failures", () => {
    const observerError = new Error("observer setup failed");
    const observerStore = createAuthSessionStore();
    const observerController = createAuthController({
      auth: {} as Auth,
      authSessionStore: observerStore,
      onAuthStateChanged: vi.fn(() => {
        throw observerError;
      }),
      signInAnonymously: vi.fn(),
    });

    expect(() => observerController.start()).not.toThrow();
    expect(observerStore.getSnapshot()).toEqual({ status: "error", error: observerError });

    const anonymousError = new Error("sign-in setup failed");
    const { publishUser, sessionStore } = createHarness(
      vi.fn(() => {
        throw anonymousError;
      })
    );
    expect(() => publishUser(null)).not.toThrow();
    expect(sessionStore.getSnapshot()).toEqual({ status: "error", error: anonymousError });
  });

  it("refreshes metadata only for the confirmed uid", () => {
    const { controller, publishUser, sessionStore } = createHarness();
    publishUser(createUser("uid-a"));

    controller.publishAuthenticatedUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));
    controller.publishAuthenticatedUser(createUser("uid-b", { isAnonymous: false, displayName: "Grace" }));

    expect(sessionStore.getSnapshot()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("ignores late callbacks after disposal", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const attempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { controller, publishError, publishUser, sessionStore } = createHarness(vi.fn(() => attempt));
    publishUser(null);
    controller.dispose();

    publishUser(createUser("uid-a"));
    publishError(new Error("late observer failure"));
    rejectSignIn(new Error("late sign-in failure"));
    await attempt.catch(() => undefined);

    expect(sessionStore.getSnapshot()).toEqual({ status: "signedOut" });
    expect(() => controller.start()).toThrow("Auth controller has been disposed");
  });
});
