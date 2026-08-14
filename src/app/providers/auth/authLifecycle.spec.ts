import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn((_auth: Auth, _onUser: (user: User | null) => void) => vi.fn()),
  signInAnonymously: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: singletonMocks.auth }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: singletonMocks.onAuthStateChanged,
  signInAnonymously: singletonMocks.signInAnonymously,
}));

const createUser = (
  uid: string,
  { isAnonymous = true, displayName = null }: { isAnonymous?: boolean; displayName?: string | null } = {}
) =>
  ({
    uid,
    isAnonymous,
    providerData: displayName == null ? [] : [{ displayName }],
  }) as User;

const createHarness = async (signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined))) => {
  vi.resetModules();
  let publishUser: (user: User | null) => void = () => undefined;
  singletonMocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
    publishUser = onUser;
    return vi.fn();
  });
  singletonMocks.signInAnonymously.mockImplementation(signInAnonymously);

  const authSession = await import("@/entities/auth");
  const lifecycle = await import("./authLifecycle");
  authSession.replaceAuthSession({ status: "initializing" });
  lifecycle.startAuthSession();

  return { ...lifecycle, ...authSession, publishUser };
};

describe("authLifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts one app-lifetime observer", async () => {
    const harness = await createHarness();

    harness.startAuthSession();

    expect(singletonMocks.onAuthStateChanged).toHaveBeenCalledOnce();
  });

  it("maps Firebase users to a Firebase-independent session snapshot", async () => {
    const { getAuthSession, publishUser } = await createHarness();

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("starts anonymous sign-in once for duplicate signed-out callbacks", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { getAuthSession, publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    publishUser(null);

    expect(getAuthSession()).toEqual({ status: "signedOut" });
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("waits for the bootstrap suspension to be released", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser, suspendAnonymousBootstrap } = await createHarness(signInAnonymously);
    const resume = suspendAnonymousBootstrap();
    publishUser(null);

    expect(signInAnonymously).not.toHaveBeenCalled();

    resume();
    resume();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("does not bootstrap anonymously when authentication returns before release", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser, suspendAnonymousBootstrap } = await createHarness(signInAnonymously);
    const resume = suspendAnonymousBootstrap();

    publishUser(null);
    publishUser(createUser("uid-a"));
    resume();

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("starts a new anonymous episode after an authenticated user signs out", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    publishUser(createUser("uid-a"));
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it("publishes anonymous sign-in failures without an identity", async () => {
    const anonymousError = new Error("anonymous sign-in failed");
    const { getAuthSession, publishUser } = await createHarness(vi.fn().mockRejectedValue(anonymousError));

    publishUser(null);

    await vi.waitFor(() => expect(getAuthSession()).toEqual({ status: "error", error: anonymousError }));
  });

  it("ignores a stale anonymous sign-in failure after authentication succeeds", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { getAuthSession, publishUser } = await createHarness(vi.fn(() => signInAttempt));

    publishUser(null);
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "uid-a" });
  });

  it("refreshes metadata only for the confirmed uid", async () => {
    const { getAuthSession, publishAuthenticatedUser, publishUser } = await createHarness();
    publishUser(createUser("uid-a"));

    publishAuthenticatedUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));
    publishAuthenticatedUser(createUser("uid-b", { isAnonymous: false, displayName: "Grace" }));

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });
});
