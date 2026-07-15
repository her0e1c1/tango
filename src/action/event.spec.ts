import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";

import * as type from "@/action/type";
import * as action from "@/action";
import * as firestore from "@/action/firestore";
import { getAuth, signOut, linkWithPopup } from "firebase/auth";
import { STUDY_STORAGE_KEY, studyStore } from "@/features/study/state/studyStore";

vi.mock("firebase/auth");
vi.mock("./firestore");

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
    localStorage.clear();
    studyStore.setState({
      session: null,
      legacyMigratedDeckIds: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
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

  it("should logout", async () => {
    studyStore.getState().startStudy("deck-id", ["card-id"]);
    studyStore.getState().markLegacyMigrated("deck-id");
    studyStore.setState({
      showBackText: true,
      autoPlay: true,
      lastSwipe: "cardSwipeRight",
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).not.toBeNull();
    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = action.event.logout();
    await f(dispatch, getState, undefined);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(type.clearAll());
    expect(studyStore.getState()).toMatchObject({
      session: null,
      legacyMigratedDeckIds: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("should login", async () => {
    const m = linkWithPopup as Mock;
    m.mockReturnValue({ user: { uid: "uid", isAnonymous: false, providerData: [{ displayName: "name" }] } });

    const ga = getAuth as Mock;
    ga.mockReturnValue({ currentUser: {} });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = action.event.loginGoogle();
    await f(dispatch, getState, undefined);
    expect(linkWithPopup).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(
      type.configUpdate({ uid: "uid", displayName: "name", isAnonymous: false, lastUpdatedAt: 0 })
    );
    // TODO: subscribe
  });

  it("clears the display name when the provider has no profile", async () => {
    const m = linkWithPopup as Mock;
    m.mockReturnValue({ user: { uid: "uid", isAnonymous: false, providerData: [] } });

    const ga = getAuth as Mock;
    ga.mockReturnValue({ currentUser: {} });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const f = action.event.loginGoogle();
    await f(dispatch, getState, undefined);

    expect(dispatch).toHaveBeenCalledWith(
      type.configUpdate({ uid: "uid", displayName: null, isAnonymous: false, lastUpdatedAt: 0 })
    );
  });
});
