import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthBootstrapStatus } from "./lifecycle";

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
  const auth = await import("@/entities/auth");
  const lifecycle = await import("./lifecycle");
  auth.setAuthUser(null);
  let authStatus: AuthBootstrapStatus = "starting";
  const stopAuthSession = lifecycle.startAuthSession((status) => {
    authStatus = status;
  });
  const publishUser = (user: User | null) => {
    if (observing) observer(user);
  };

  return {
    ...auth,
    ...studySession,
    getAuthStatus: () => authStatus,
    publishUser,
    stopAuthSession,
  };
};

describe("lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stops observing authentication changes after cleanup", async () => {
    const { getAuthUser, publishUser, stopAuthSession } = await createHarness();

    publishUser(createUser("uid-a"));
    stopAuthSession();
    publishUser(createUser("uid-b"));

    expect(getAuthUser()).toMatchObject({ uid: "uid-a" });
  });

  it("maps Firebase users to a Firebase-independent user snapshot", async () => {
    const { getAuthUser, publishUser } = await createHarness();

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(getAuthUser()).toEqual({
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("publishes linked Google metadata from the observer for the same uid", async () => {
    const { getAuthUser, publishUser } = await createHarness();
    publishUser(createUser("uid-a"));

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(getAuthUser()).toEqual({
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });
  });

  it("clears persisted Study state before initial anonymous sign-in", async () => {
    const deckId = "deck-a";
    const { getAuthStatus, getAuthUser, getStudySession, publishUser, startStudy } = await createHarness();
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const studySessionsAtSignIn: unknown[] = [];
    singletonMocks.signInAnonymously.mockImplementation(() => {
      studySessionsAtSignIn.push(getStudySession(deckId));
      return new Promise<UserCredential>(() => undefined);
    });

    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(studySessionsAtSignIn).toEqual([undefined]);
    expect(getAuthUser()).toBeNull();
    expect(getAuthStatus()).toBe("starting");
  });

  it("starts a new anonymous episode after clearing an authenticated user's study state", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthStatus, getAuthUser, getStudySession, publishUser, startStudy } =
      await createHarness(signInAnonymously);

    publishUser(null);
    publishUser(createUser("uid-a"));
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(getAuthUser()).toBeNull();
    expect(getAuthStatus()).toBe("starting");
    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it("does not restart anonymous sign-in for duplicate unauthenticated events", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthStatus, getStudySession, publishUser, startStudy } = await createHarness(signInAnonymously);

    publishUser(null);
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeDefined();
    expect(getAuthStatus()).toBe("starting");
  });

  it("reports Study cleanup failures before anonymous bootstrap", async () => {
    const cleanupError = new Error("Study cleanup failed");
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getAuthStatus, getAuthUser, getStudySession, publishUser, startStudy } =
      await createHarness(signInAnonymously);
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw cleanupError;
    });

    publishUser(createUser("uid-a"));
    publishUser(null);

    expect(getStudySession(deckId)).toBeUndefined();
    expect(getAuthUser()).toBeNull();
    expect(getAuthStatus()).toBe("error");
    expect(signInAnonymously).not.toHaveBeenCalled();
    removeItem.mockRestore();
  });

  it("reports anonymous sign-in failures without an identity", async () => {
    const anonymousError = new Error("anonymous sign-in failed");
    const { getAuthStatus, getAuthUser, publishUser } = await createHarness(vi.fn().mockRejectedValue(anonymousError));

    publishUser(null);

    await vi.waitFor(() => expect(getAuthStatus()).toBe("error"));
    expect(getAuthUser()).toBeNull();
  });

  it("ignores a stale anonymous sign-in failure after authentication succeeds", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { getAuthStatus, getAuthUser, publishUser } = await createHarness(vi.fn(() => signInAttempt));

    publishUser(null);
    await vi.waitFor(() => expect(singletonMocks.signInAnonymously).toHaveBeenCalledOnce());
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(getAuthUser()).toMatchObject({ uid: "uid-a" });
    expect(getAuthStatus()).toBe("authenticated");
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
    const { getAuthStatus, getAuthUser, publishUser } = await createHarness(signInAnonymously);

    publishUser(null);
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledOnce());

    publishUser(createUser("uid-a"));
    publishUser(null);
    await vi.waitFor(() => expect(signInAnonymously).toHaveBeenCalledTimes(2));

    rejectFirstSignIn(new Error("late failure"));
    await firstSignIn.catch(() => undefined);

    expect(getAuthUser()).toBeNull();
    expect(getAuthStatus()).toBe("starting");
  });
});
