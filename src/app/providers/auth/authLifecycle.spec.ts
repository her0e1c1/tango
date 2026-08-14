import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onIdTokenChanged: vi.fn((_auth: Auth, _onUser: (user: User | null) => void) => vi.fn()),
  signInAnonymously: vi.fn(),
  clearStudyStore: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: singletonMocks.auth }));
vi.mock("@/features/study", () => ({ clearStudyStore: singletonMocks.clearStudyStore }));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: singletonMocks.onIdTokenChanged,
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
  const unsubscribe = vi.fn();
  singletonMocks.onIdTokenChanged.mockImplementation((_auth, onUser) => {
    publishUser = onUser;
    return unsubscribe;
  });
  singletonMocks.signInAnonymously.mockImplementation(signInAnonymously);
  singletonMocks.clearStudyStore.mockResolvedValue(undefined);

  const authSession = await import("@/entities/auth");
  const lifecycle = await import("./authLifecycle");
  authSession.replaceAuthSession({ status: "initializing" });
  const stopAuthSession = lifecycle.startAuthSession();

  return { ...lifecycle, ...authSession, publishUser, stopAuthSession, unsubscribe };
};

describe("authLifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the Firebase observer cleanup", async () => {
    const { stopAuthSession, unsubscribe } = await createHarness();

    expect(singletonMocks.onIdTokenChanged).toHaveBeenCalledOnce();
    expect(stopAuthSession).toBe(unsubscribe);
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

  it("publishes linked Google metadata from the observer for the same uid", async () => {
    const { getAuthSession, publishUser } = await createHarness();
    publishUser(createUser("uid-a"));

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("clears persisted Study state before initial anonymous sign-in", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { getAuthSession, publishUser } = await createHarness(signInAnonymously);

    publishUser(null);

    expect(getAuthSession()).toEqual({ status: "signedOut" });
    expect(singletonMocks.clearStudyStore).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());
  });

  it("waits for Study cleanup before anonymous sign-in", async () => {
    let finishCleanup: () => void = () => undefined;
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockReturnValue(cleanup);

    publishUser(null);

    expect(singletonMocks.clearStudyStore).toHaveBeenCalledOnce();
    expect(signInAnonymously).not.toHaveBeenCalled();

    finishCleanup();
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());
  });

  it("does not bootstrap anonymously when authentication returns during cleanup", async () => {
    let finishCleanup: () => void = () => undefined;
    const cleanup = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockReturnValue(cleanup);

    publishUser(createUser("uid-a"));
    publishUser(null);
    publishUser(createUser("uid-b"));
    finishCleanup();
    await cleanup;
    await Promise.resolve();

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("starts a new anonymous episode after clearing an authenticated user's study state", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());
    publishUser(createUser("uid-a"));
    publishUser(null);

    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledTimes(2));
  });

  it("publishes Study cleanup failures before anonymous bootstrap", async () => {
    const cleanupError = new Error("Study cleanup failed");
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const { getAuthSession, publishUser } = await createHarness(signInAnonymously);
    singletonMocks.clearStudyStore.mockRejectedValue(cleanupError);

    publishUser(createUser("uid-a"));
    publishUser(null);

    await vi.waitFor(() => expect(getAuthSession()).toEqual({ status: "error", error: cleanupError }));
    expect(signInAnonymously).not.toHaveBeenCalled();
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
    await vi.waitFor(() => expect(singletonMocks.signInAnonymously).toHaveBeenCalledOnce());
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "uid-a" });
  });
});
