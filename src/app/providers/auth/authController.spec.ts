import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthSession, replaceAuthSession } from "@/entities/auth-session";

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

import { createAuthRuntime } from "./authController";

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
  const onAuthStateChanged = vi.fn((_auth, onUser) => {
    publishUser = onUser;
    return vi.fn();
  });
  const runtime = createAuthRuntime({
    auth: {} as Auth,
    onAuthStateChanged,
    signInAnonymously,
  });
  runtime.start();
  return { runtime, onAuthStateChanged, publishUser };
};

describe("authController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceAuthSession({ status: "initializing" });
  });

  it("starts one app-lifetime observer", () => {
    const harness = createHarness();

    harness.runtime.start();

    expect(harness.onAuthStateChanged).toHaveBeenCalledOnce();
  });

  it("maps Firebase users to a Firebase-independent session snapshot", () => {
    const { publishUser } = createHarness();

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("starts anonymous sign-in once for duplicate signed-out callbacks", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = createHarness(signInAnonymously);

    publishUser(null);
    publishUser(null);

    expect(getAuthSession()).toEqual({ status: "signedOut" });
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("waits for the bootstrap suspension to be released", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { runtime, publishUser } = createHarness(signInAnonymously);
    const resume = runtime.suspendAnonymousBootstrap();
    publishUser(null);

    expect(signInAnonymously).not.toHaveBeenCalled();

    resume();
    resume();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("does not bootstrap anonymously when authentication returns before release", () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { runtime, publishUser } = createHarness(signInAnonymously);
    const resume = runtime.suspendAnonymousBootstrap();

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

  it("publishes anonymous sign-in failures without an identity", async () => {
    const anonymousError = new Error("anonymous sign-in failed");
    const { publishUser } = createHarness(vi.fn().mockRejectedValue(anonymousError));

    publishUser(null);

    await vi.waitFor(() => expect(getAuthSession()).toEqual({ status: "error", error: anonymousError }));
  });

  it("ignores a stale anonymous sign-in failure after authentication succeeds", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { publishUser } = createHarness(vi.fn(() => signInAttempt));

    publishUser(null);
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "uid-a" });
  });

  it("refreshes metadata only for the confirmed uid", () => {
    const { runtime, publishUser } = createHarness();
    publishUser(createUser("uid-a"));

    runtime.publishAuthenticatedUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));
    runtime.publishAuthenticatedUser(createUser("uid-b", { isAnonymous: false, displayName: "Grace" }));

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });
});
