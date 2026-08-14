import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn((_auth: Auth, _onUser: (user: User | null) => void) => vi.fn()),
  signInAnonymously: vi.fn(),
  clearStudyStore: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: singletonMocks.auth }));
vi.mock("@/features/study", () => ({ clearStudyStore: singletonMocks.clearStudyStore }));
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
  singletonMocks.clearStudyStore.mockResolvedValue(undefined);

  const authSession = await import("@/entities/auth-session");
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

  it("waits for previous-user study cleanup before anonymous bootstrap", async () => {
    let finishCleanup: () => void = () => undefined;
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockReturnValue(cleanup);

    publishUser(createUser("uid-a", { isAnonymous: false }));
    publishUser(null);

    expect(singletonMocks.clearStudyStore).toHaveBeenCalledOnce();
    expect(signInAnonymously).not.toHaveBeenCalled();

    finishCleanup();
    await cleanup;
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());
  });

  it("publishes cleanup failures without starting an anonymous session", async () => {
    const cleanupError = new Error("study cleanup failed");
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { getAuthSession, publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockRejectedValue(cleanupError);

    publishUser(createUser("uid-a", { isAnonymous: false }));
    publishUser(null);

    await vi.waitFor(() => expect(getAuthSession()).toEqual({ status: "error", error: cleanupError }));
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("does not clear study state when sign-out is never observed", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);

    publishUser(createUser("uid-a", { isAnonymous: false }));

    expect(singletonMocks.clearStudyStore).not.toHaveBeenCalled();
  });

  it("ignores duplicate signed-out callbacks while cleanup is pending", async () => {
    const cleanup = new Promise<void>(() => undefined);
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockReturnValue(cleanup);

    publishUser(createUser("uid-a", { isAnonymous: false }));
    publishUser(null);
    publishUser(null);

    expect(singletonMocks.clearStudyStore).toHaveBeenCalledOnce();
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("does not bootstrap anonymously when authentication returns before cleanup", async () => {
    let finishCleanup: () => void = () => undefined;
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockReturnValue(cleanup);

    publishUser(createUser("uid-a", { isAnonymous: false }));
    publishUser(null);
    publishUser(createUser("uid-b"));
    finishCleanup();
    await cleanup;

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("starts a new anonymous episode after clearing an authenticated user's study state", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    publishUser(createUser("uid-a"));
    publishUser(null);

    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledTimes(2));
    expect(singletonMocks.clearStudyStore).toHaveBeenCalledOnce();
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
