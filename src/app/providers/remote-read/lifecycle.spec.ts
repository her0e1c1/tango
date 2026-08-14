import { beforeEach, describe, expect, it, vi } from "vitest";

type Session =
  | { status: "initializing" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; uid: string; isAnonymous: boolean; displayName: string | null };
type AuthenticatedSession = Extract<Session, { status: "authenticated" }>;

const mocks = vi.hoisted(() => ({
  session: { status: "initializing" } as Session,
  authListener: undefined as ((session: Session) => void) | undefined,
  unsubscribeAuth: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/entities/auth", () => ({
  getAuthSession: () => mocks.session,
  subscribeAuthSession: (listener: (session: Session) => void) => {
    mocks.authListener = listener;
    return mocks.unsubscribeAuth;
  },
}));
vi.mock("@/entities/card", () => ({
  clearCards: () => mocks.operations.push("clear Cards"),
}));
vi.mock("@/entities/deck", () => ({
  clearDecks: () => mocks.operations.push("clear Decks"),
}));
vi.mock("./card", () => ({
  startCardSynchronization: (uid: string) => {
    mocks.operations.push(`start Cards ${uid}`);
    return () => mocks.operations.push(`stop Cards ${uid}`);
  },
}));
vi.mock("./deck", () => ({
  subscribeDecks: (uid: string) => {
    mocks.operations.push(`start Decks ${uid}`);
    return () => mocks.operations.push(`stop Decks ${uid}`);
  },
}));

import { startRemoteReadSessionLifecycle } from "./lifecycle";

const authenticated = (uid: string): AuthenticatedSession => ({
  status: "authenticated",
  uid,
  isAnonymous: true,
  displayName: null,
});

const publish = (session: Session) => {
  mocks.session = session;
  mocks.authListener?.(session);
};

describe("remote read session lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session = { status: "initializing" };
    mocks.authListener = undefined;
    mocks.operations.length = 0;
  });

  it("clears entity data without starting listeners for a signed-out session", () => {
    mocks.session = { status: "unauthenticated" };

    startRemoteReadSessionLifecycle();

    expect(mocks.operations).toEqual(["clear Cards", "clear Decks"]);
  });

  it("stops and clears the previous session before starting the replacement", () => {
    startRemoteReadSessionLifecycle();
    publish(authenticated("uid-a"));
    mocks.operations.length = 0;

    publish(authenticated("uid-b"));

    expect(mocks.operations).toEqual([
      "stop Cards uid-a",
      "stop Decks uid-a",
      "clear Cards",
      "clear Decks",
      "start Cards uid-b",
      "start Decks uid-b",
    ]);
  });

  it("keeps listeners running when authentication metadata changes for the same UID", () => {
    startRemoteReadSessionLifecycle();
    publish(authenticated("uid-a"));
    mocks.operations.length = 0;

    publish({ ...authenticated("uid-a"), isAnonymous: false, displayName: "Ada" });

    expect(mocks.operations).toEqual([]);
  });

  it("stops and clears the current session on logout without starting listeners", () => {
    startRemoteReadSessionLifecycle();
    publish(authenticated("uid-a"));
    mocks.operations.length = 0;

    publish({ status: "unauthenticated" });

    expect(mocks.operations).toEqual(["stop Cards uid-a", "stop Decks uid-a", "clear Cards", "clear Decks"]);
  });

  it("unsubscribes and clears the current session on App teardown", () => {
    const stopLifecycle = startRemoteReadSessionLifecycle();
    publish(authenticated("uid-a"));
    mocks.operations.length = 0;

    stopLifecycle();

    expect(mocks.unsubscribeAuth).toHaveBeenCalledOnce();
    expect(mocks.operations).toEqual(["stop Cards uid-a", "stop Decks uid-a", "clear Cards", "clear Decks"]);
  });
});
