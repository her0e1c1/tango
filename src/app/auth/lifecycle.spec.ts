import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onIdTokenChanged: vi.fn((_auth: Auth, _onUser: (user: User | null) => void) => () => undefined),
  signInAnonymously: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: singletonMocks.auth }));
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
  let observer: (user: User | null) => void = () => undefined;
  let observing = true;
  singletonMocks.onIdTokenChanged.mockImplementation((_auth, onUser) => {
    observer = onUser;
    observing = true;
    return () => {
      observing = false;
    };
  });
  singletonMocks.signInAnonymously.mockImplementation(signInAnonymously);

  const studySession = await import("@/entities/study-session");
  studySession.clearStudySessions();
  const authSession = await import("@/entities/auth");
  const lifecycle = await import("./lifecycle");
  authSession.replaceAuthSession({ status: "initializing" });
  const stopAuthSession = lifecycle.startAuthSession();
  const publishUser = (user: User | null) => {
    if (observing) observer(user);
  };

  return { ...lifecycle, ...authSession, ...studySession, publishUser, stopAuthSession };
};

describe("lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stops observing authentication changes after cleanup", async () => {
    const { getAuthSession, publishUser, stopAuthSession } = await createHarness();

    publishUser(createUser("uid-a"));
    stopAuthSession();
    publishUser(createUser("uid-b"));

    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "uid-a" });
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
    const deckId = "deck-a";
    const { getAuthSession, getStudySession, publishUser, startStudy } = await createHarness();
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const studySessionsAtSignIn: unknown[] = [];
    singletonMocks.signInAnonymously.mockImplementation(() => {
      studySessionsAtSignIn.push(getStudySession(deckId));
      return new Promise<UserCredential>(() => undefined);
    });

    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(studySessionsAtSignIn).toEqual([undefined]);
    expect(getAuthSession()).toMatchObject({ status: "authenticating", attemptId: expect.any(Symbol) });
  });

  it("starts a new anonymous episode after clearing an authenticated user's study state", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthSession, getStudySession, publishUser, startStudy } = await createHarness(signInAnonymously);

    publishUser(null);
    const firstAttempt = getAuthSession();
    publishUser(createUser("uid-a"));
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(getAuthSession()).toMatchObject({ status: "authenticating", attemptId: expect.any(Symbol) });
    expect(getAuthSession()).not.toEqual(firstAttempt);
    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it("does not restart anonymous sign-in for duplicate unauthenticated events", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthSession, getStudySession, publishUser, startStudy } = await createHarness(signInAnonymously);

    publishUser(null);
    const attempt = getAuthSession();
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeDefined();
    expect(getAuthSession()).toEqual(attempt);
  });

  it("publishes Study cleanup failures before anonymous bootstrap", async () => {
    const cleanupError = new Error("Study cleanup failed");
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthSession, getStudySession, publishUser, startStudy } = await createHarness(signInAnonymously);
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw cleanupError;
    });

    publishUser(createUser("uid-a"));
    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(getAuthSession()).toEqual({ status: "error", error: cleanupError });
    expect(signInAnonymously).not.toHaveBeenCalled();
    removeItem.mockRestore();
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

  it("ignores a stale failure after a later anonymous attempt starts", async () => {
    let rejectFirstSignIn: (error: unknown) => void = () => undefined;
    const firstSignIn = new Promise<UserCredential>((_resolve, reject) => {
      rejectFirstSignIn = reject;
    });
    const secondSignIn = new Promise<UserCredential>(() => undefined);
    const signInAnonymously = vi
      .fn()
      .mockImplementationOnce(() => firstSignIn)
      .mockImplementationOnce(() => secondSignIn);
    const { getAuthSession, publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());
    const firstAttempt = getAuthSession();
    expect(firstAttempt).toMatchObject({ status: "authenticating", attemptId: expect.any(Symbol) });

    publishUser(createUser("uid-a"));
    publishUser(null);
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledTimes(2));
    const secondAttempt = getAuthSession();
    expect(secondAttempt).toMatchObject({ status: "authenticating", attemptId: expect.any(Symbol) });
    expect(secondAttempt).not.toEqual(firstAttempt);

    rejectFirstSignIn(new Error("late failure"));
    await firstSignIn.catch(() => undefined);

    expect(getAuthSession()).toEqual(secondAttempt);
  });
});
