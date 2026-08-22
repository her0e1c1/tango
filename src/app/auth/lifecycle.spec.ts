import type { Auth, User, UserCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/entities/user";

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
  let observing = false;
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
  const lifecycle = await import("./lifecycle");
  const users: (CurrentUser | null)[] = [];
  const errors: unknown[] = [];
  const handlers = {
    onUserChange: (user: CurrentUser | null) => users.push(user),
    onError: (error: unknown) => errors.push(error),
  };
  const stopAuthSession = lifecycle.startAuthSession(handlers);
  const publishUser = (user: User | null) => {
    if (observing) observer(user);
  };

  return { ...lifecycle, ...studySession, errors, handlers, publishUser, stopAuthSession, users };
};

describe("lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stops publishing authentication changes after cleanup", async () => {
    const { publishUser, stopAuthSession, users } = await createHarness();

    publishUser(createUser("uid-a"));
    stopAuthSession();
    publishUser(createUser("uid-b"));

    expect(users).toEqual([{ uid: "uid-a", isAnonymous: true, displayName: null }]);
  });

  it("maps Firebase users to Firebase-independent current users", async () => {
    const { publishUser, users } = await createHarness();

    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(users).toEqual([{ uid: "uid-a", isAnonymous: false, displayName: "Ada" }]);
  });

  it("publishes linked Google metadata for the same uid", async () => {
    const { publishUser, users } = await createHarness();

    publishUser(createUser("uid-a"));
    publishUser(createUser("uid-a", { isAnonymous: false, displayName: "Ada" }));

    expect(users).toEqual([
      { uid: "uid-a", isAnonymous: true, displayName: null },
      { uid: "uid-a", isAnonymous: false, displayName: "Ada" },
    ]);
  });

  it("clears persisted Study state before anonymous sign-in", async () => {
    const deckId = "deck-a";
    const { getStudySession, publishUser, startStudy, users } = await createHarness();
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    const studySessionsAtSignIn: unknown[] = [];
    singletonMocks.signInAnonymously.mockImplementation(() => {
      studySessionsAtSignIn.push(getStudySession(deckId));
      return new Promise<UserCredential>(() => undefined);
    });

    publishUser(null);

    expect(users).toEqual([null]);
    expect(getStudySession(deckId)).toBeUndefined();
    expect(studySessionsAtSignIn).toEqual([undefined]);
  });

  it("does not restart anonymous sign-in for duplicate signed-out events", async () => {
    const signInAnonymously = vi.fn(() => new Promise<UserCredential>(() => undefined));
    const deckId = "deck-a";
    const { getStudySession, publishUser, startStudy } = await createHarness(signInAnonymously);

    publishUser(null);
    startStudy(deckId, [], { shuffled: false, maxNumberOfCardsToLearn: 0 });
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledOnce();
    expect(getStudySession(deckId)).toBeDefined();
  });

  it("reports the Study cleanup error before anonymous sign-in", async () => {
    const cleanupError = new Error("Study cleanup failed");
    const { errors, publishUser } = await createHarness();
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw cleanupError;
    });

    publishUser(null);

    expect(errors).toEqual([cleanupError]);
    expect(singletonMocks.signInAnonymously).not.toHaveBeenCalled();
    removeItem.mockRestore();
  });

  it("reports the anonymous sign-in error", async () => {
    const anonymousError = new Error("anonymous sign-in failed");
    const { errors, publishUser } = await createHarness(vi.fn().mockRejectedValue(anonymousError));

    publishUser(null);

    await vi.waitFor(() => expect(errors).toEqual([anonymousError]));
  });

  it("ignores a stale anonymous sign-in failure after authentication succeeds", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const { errors, publishUser, users } = await createHarness(vi.fn(() => signInAttempt));

    publishUser(null);
    publishUser(createUser("uid-a"));
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(errors).toEqual([]);
    expect(users.at(-1)).toEqual({ uid: "uid-a", isAnonymous: true, displayName: null });
  });

  it("keeps one anonymous attempt across lifecycle recreation", async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const signInAnonymously = vi.fn(() => signInAttempt);
    const { errors, publishUser, startAuthSession, stopAuthSession } = await createHarness(signInAnonymously);

    publishUser(null);
    stopAuthSession();

    const restartedErrors: unknown[] = [];
    const stopRestartedSession = startAuthSession({
      onUserChange: () => undefined,
      onError: (error) => restartedErrors.push(error),
    });
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledOnce();

    const failure = new Error("anonymous sign-in failed after restart");
    rejectSignIn(failure);
    await signInAttempt.catch(() => undefined);

    expect(errors).toEqual([]);
    expect(restartedErrors).toEqual([failure]);
    stopRestartedSession();
  });
});
