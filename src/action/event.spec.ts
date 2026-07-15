import { expect, it, describe, vi, beforeEach, afterEach, type Mock } from "vitest";

import * as type from "@/action/type";
import * as action from "@/action";
import * as firestore from "@/action/firestore";
import { signOut, linkWithPopup } from "firebase/auth";
import { STUDY_STORAGE_KEY, studyStore } from "@/features/study/state/studyStore";
import { createRootState } from "@/test/factories";

const authMocks = vi.hoisted(() => ({
  auth: { currentUser: null as object | null },
  publishAuthenticatedUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  cleanupFirestoreUid: vi.fn(),
}));

vi.mock("firebase/auth");
vi.mock("./firestore");
vi.mock("@/firebase", () => ({ auth: authMocks.auth }));
vi.mock("@/auth/AuthContext", () => ({
  publishAuthenticatedUser: authMocks.publishAuthenticatedUser,
  suspendAnonymousBootstrap: authMocks.suspendAnonymousBootstrap,
}));
vi.mock("@/query/cleanup", () => ({ cleanupFirestoreUid: authMocks.cleanupFirestoreUid }));

vi.mock("firebase/firestore", () => ({
  ...Object.fromEntries(Object.keys(vi.importActual("firebase/firestore")).map((key) => [key, vi.fn()])),
  getFirestore: vi.fn(() => "db"),
}));

describe("event action", () => {
  const timestamp = new Date();
  const mockedDate = new Date(1999, 10, 1);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockedDate);
    vi.resetAllMocks();
    authMocks.suspendAnonymousBootstrap.mockReturnValue(authMocks.resumeAnonymousBootstrap);
    authMocks.auth.currentUser = null;
    localStorage.clear();
    studyStore.setState({
      session: null,
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    try {
      action.event.stopSubscriptions();
    } catch {
      // Individual tests assert listener errors; always isolate the next test.
    }
  });

  describe("deckOnChange", () => {
    it("should subscribe deck", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const lastUpdatedAt = timestamp.getTime();
      const deck = { id: "id" } as Deck;
      const e = { added: [deck] as Deck[], lastUpdatedAt } as DeckEvent;
      const f = action.event.deckOnChange(e);
      await f(dispatch, getState, undefined);
      expect(dispatch).toHaveBeenCalledWith(type.deckBulkInsert([deck]));
      expect(dispatch).toHaveBeenCalledWith(type.configUpdate({ lastUpdatedAt }));
    });
  });

  describe("subscribe card", () => {
    it("should subscribe card", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];

      const lastUpdatedAt = timestamp.getTime();
      const card = { id: "id" } as Card;
      const e = { added: [card] as Card[], lastUpdatedAt } as CardEvent;
      const f = action.event.cardOnChange(e);
      await f(dispatch, getState, undefined);
      expect(dispatch).toHaveBeenCalledWith(type.cardBulkInsert([card]));
      expect(dispatch).toHaveBeenCalledWith(type.configUpdate({ lastUpdatedAt }));
    });
  });

  describe("realtime subscriptions", () => {
    it("stops every active listener through the common API", async () => {
      const stopDeck = vi.fn();
      const stopCard = vi.fn();
      vi.mocked(firestore.event.subscribeDeck).mockReturnValue(stopDeck);
      vi.mocked(firestore.event.subscribeCard).mockReturnValue(stopCard);
      const dispatch = vi.fn();
      const getState = vi.fn(() => createRootState());

      await action.event.subscribe("uid-a")(dispatch, getState, undefined);
      action.event.stopSubscriptions();
      action.event.stopSubscriptions();

      expect(stopDeck).toHaveBeenCalledTimes(1);
      expect(stopCard).toHaveBeenCalledTimes(1);
    });

    it("stops old listeners before registering replacements", async () => {
      const operations: string[] = [];
      vi.mocked(firestore.event.subscribeDeck).mockImplementation(({ uid }) => {
        operations.push(`subscribe-deck-${uid}`);
        return () => operations.push(`stop-deck-${uid}`);
      });
      vi.mocked(firestore.event.subscribeCard).mockImplementation(({ uid }) => {
        operations.push(`subscribe-card-${uid}`);
        return () => operations.push(`stop-card-${uid}`);
      });
      const dispatch = vi.fn();
      const getState = vi.fn(() => createRootState());

      await action.event.subscribe("uid-a")(dispatch, getState, undefined);
      await action.event.subscribe("uid-b")(dispatch, getState, undefined);

      expect(operations).toEqual([
        "subscribe-deck-uid-a",
        "subscribe-card-uid-a",
        "stop-card-uid-a",
        "stop-deck-uid-a",
        "subscribe-deck-uid-b",
        "subscribe-card-uid-b",
      ]);

      action.event.stopSubscriptions();
    });

    it("cleans a partial registration when later listener setup fails", async () => {
      const setupError = new Error("card setup failed");
      const stopDeck = vi.fn();
      vi.mocked(firestore.event.subscribeDeck).mockReturnValue(stopDeck);
      vi.mocked(firestore.event.subscribeCard).mockImplementation(() => {
        throw setupError;
      });
      const dispatch = vi.fn();
      const getState = vi.fn(() => createRootState());

      await expect(action.event.subscribe("uid-a")(dispatch, getState, undefined)).rejects.toBe(setupError);

      expect(stopDeck).toHaveBeenCalledTimes(1);
      action.event.stopSubscriptions();
      expect(stopDeck).toHaveBeenCalledTimes(1);
    });

    it("drains every listener before surfacing a stop error", async () => {
      const stopError = new Error("card stop failed");
      const stopDeck = vi.fn();
      const stopCard = vi.fn(() => {
        throw stopError;
      });
      vi.mocked(firestore.event.subscribeDeck).mockReturnValue(stopDeck);
      vi.mocked(firestore.event.subscribeCard).mockReturnValue(stopCard);
      const dispatch = vi.fn();
      const getState = vi.fn(() => createRootState());
      await action.event.subscribe("uid-a")(dispatch, getState, undefined);

      expect(() => action.event.stopSubscriptions()).toThrow(stopError);

      expect(stopCard).toHaveBeenCalledTimes(1);
      expect(stopDeck).toHaveBeenCalledTimes(1);
      expect(() => action.event.stopSubscriptions()).not.toThrow();
    });
  });

  describe("removeFromLocal", () => {
    it("delete deck", async () => {
      vi.spyOn(firestore.deck, "exists").mockImplementation(async () => false);
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({
        deck: { byId: { deckId: { localMode: false } } },
        card: { byId: { cardId: { deckId: "deckId" } } },
      });
      const f = action.event.removeFromLocal();
      await f(dispatch, getState, undefined);
      expect(dispatch).toHaveBeenCalledWith(type.deckDelete("deckId"));
    });
    it("delete card", async () => {
      vi.spyOn(firestore.deck, "exists").mockImplementation(async () => false);
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({
        deck: { byId: { deckId: { localMode: false } } },
        card: { byId: { cardId: { deckId: "deckId" } } },
      });
      const f = action.event.removeFromLocal();
      await f(dispatch, getState, undefined);
      expect(dispatch).toHaveBeenCalledWith(type.cardDelete("cardId"));
    });
  });

  it("signs out before cleaning the confirmed UID and local state", async () => {
    const operations: string[] = [];
    authMocks.suspendAnonymousBootstrap.mockImplementation(() => {
      operations.push("suspend-anonymous");
      return () => operations.push("resume-anonymous");
    });
    studyStore.getState().startStudy("deck-id", ["card-id"]);
    studyStore.setState({
      showBackText: true,
      autoPlay: true,
      lastSwipe: "cardSwipeRight",
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).not.toBeNull();
    const dispatch = vi.fn((dispatchedAction) => {
      operations.push("clear-redux");
      expect(dispatchedAction).toEqual(type.clearAll());
      expect(studyStore.getState().session).toBeNull();
    });
    const getState = vi.fn();
    vi.mocked(signOut).mockImplementation(async (receivedAuth) => {
      operations.push("sign-out");
      expect(receivedAuth).toBe(authMocks.auth);
      expect(dispatch).not.toHaveBeenCalled();
      expect(studyStore.getState().session).not.toBeNull();
    });
    authMocks.cleanupFirestoreUid.mockImplementation(async (uid) => {
      operations.push(`cleanup:${uid}`);
      expect(dispatch).not.toHaveBeenCalled();
      expect(studyStore.getState().session).not.toBeNull();
    });
    const f = action.event.logout("confirmed-uid");
    await f(dispatch, getState, undefined);

    expect(operations).toEqual([
      "suspend-anonymous",
      "sign-out",
      "cleanup:confirmed-uid",
      "clear-redux",
      "resume-anonymous",
    ]);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(authMocks.cleanupFirestoreUid).toHaveBeenCalledWith("confirmed-uid");
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(studyStore.getState()).toMatchObject({
      session: null,
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("preserves listeners, cache, study, and Redux when sign-out fails", async () => {
    const signOutError = new Error("sign-out failed");
    const stopDeck = vi.fn();
    const stopCard = vi.fn();
    vi.mocked(firestore.event.subscribeDeck).mockReturnValue(stopDeck);
    vi.mocked(firestore.event.subscribeCard).mockReturnValue(stopCard);
    const dispatch = vi.fn();
    const getState = vi.fn(() => createRootState());
    await action.event.subscribe("confirmed-uid")(dispatch, getState, undefined);
    dispatch.mockClear();
    studyStore.getState().startStudy("deck-id", ["card-id"]);
    vi.mocked(signOut).mockRejectedValue(signOutError);

    await expect(action.event.logout("confirmed-uid")(dispatch, getState, undefined)).rejects.toBe(signOutError);

    expect(stopDeck).not.toHaveBeenCalled();
    expect(stopCard).not.toHaveBeenCalled();
    expect(authMocks.cleanupFirestoreUid).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).not.toBeNull();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).not.toBeNull();
    expect(authMocks.suspendAnonymousBootstrap).toHaveBeenCalledTimes(1);
    expect(authMocks.resumeAnonymousBootstrap).toHaveBeenCalledTimes(1);
  });

  it("clears local state after cleanup attempts even when cleanup fails", async () => {
    const cleanupError = new Error("cleanup failed");
    const dispatch = vi.fn();
    const getState = vi.fn();
    studyStore.getState().startStudy("deck-id", ["card-id"]);
    vi.mocked(signOut).mockResolvedValue();
    authMocks.cleanupFirestoreUid.mockRejectedValue(cleanupError);

    await expect(action.event.logout("confirmed-uid")(dispatch, getState, undefined)).rejects.toBe(cleanupError);

    expect(authMocks.cleanupFirestoreUid).toHaveBeenCalledWith("confirmed-uid");
    expect(studyStore.getState().session).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(type.clearAll());
    expect(authMocks.suspendAnonymousBootstrap).toHaveBeenCalledTimes(1);
    expect(authMocks.resumeAnonymousBootstrap).toHaveBeenCalledTimes(1);
  });

  it("should login", async () => {
    const m = linkWithPopup as Mock;
    const user = { uid: "uid", isAnonymous: false, providerData: [{ displayName: "name" }] };
    m.mockReturnValue({ user });
    authMocks.auth.currentUser = {};

    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = action.event.loginGoogle();
    await f(dispatch, getState, undefined);
    expect(linkWithPopup).toHaveBeenCalledTimes(1);
    expect(authMocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
    expect(dispatch).not.toHaveBeenCalled();
    expect(firestore.event.subscribeDeck).not.toHaveBeenCalled();
    expect(firestore.event.subscribeCard).not.toHaveBeenCalled();
  });

  it("publishes linked users without directly updating config", async () => {
    const m = linkWithPopup as Mock;
    const user = { uid: "uid", isAnonymous: false, providerData: [] };
    m.mockReturnValue({ user });
    authMocks.auth.currentUser = {};

    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = action.event.loginGoogle();
    await f(dispatch, getState, undefined);

    expect(authMocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
