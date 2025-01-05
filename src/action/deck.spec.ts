import { expect, it, describe, vi, beforeEach } from "vitest";

import moment from "moment";
import * as fileSaver from "file-saver";

import * as firestore from "./firestore";
import * as type from "./type";
import * as action from ".";

vi.mock("./firestore");
vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));
vi.mock("firebase/firestore");

describe("deck action", () => {
  const card = { frontText: "front", backText: "back" } as Card;
  const mockedDate = new Date(1999, 10, 1);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockedDate);
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("prepareDeck", () => {
    it("should prepare deck", async () => {
      const deck = {
        name: "name",
        uid: "uid",
        currentIndex: null,
        scoreMax: null,
        scoreMin: null,
        sheetId: null,
        url: null,
        isPublic: false,
        deletedAt: null,
      } as unknown as Deck;
      expect(action.deck.prepare({ name: "name" }, "uid")).toEqual(deck);
    });
  });

  describe("generateName", () => {
    const state = { byId: { 1: { name: "name" } as Deck }, categories: [] } as DeckState;

    it("should generate name", async () => {
      const name = action.deck.generateName("deckName", state);
      expect(name).toBe("deckName");
    });

    it("should generate name with _1", async () => {
      const name = action.deck.generateName("name", state);
      expect(name).toBe("name_1");
    });

    it("should generate name with _2", async () => {
      state.byId["2"] = { name: "name_1" } as Deck;
      const name = action.deck.generateName("name", state);
      expect(name).toBe("name_2");
    });
  });

  describe("create", () => {
    it("should create", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ config: { uid: "uid" }, deck: { byId: {} } });

      const f = action.deck.create("name", [card]);
      await f(dispatch, getState, undefined);
      const deck = action.deck.prepare({ name: "name" } as Deck, "uid");
      expect(firestore.deck.create).lastCalledWith(deck, [{ ...card }]);
    });
  });

  describe("update", () => {
    it("should update", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];

      const d = { name: "deck" } as Deck;
      const f = action.deck.update(d);
      await f(dispatch, getState, undefined);
      expect(firestore.deck.update).lastCalledWith(d);
    });
  });

  describe("remove", () => {
    it("should remove", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ config: { uid: "uid" } });

      const f = action.deck.remove("deckId");
      await f(dispatch, getState, undefined);
      expect(firestore.deck.remove).toHaveBeenCalledWith("deckId", "uid");
    });
  });

  describe("start", () => {
    it("should start", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({
        config: { uid: "uid", defaultAutoPlay: true },
        deck: { byId: { deckId: { cardIds: [] } } },
        card: { byId: {} },
      });

      const update = vi.spyOn(action.deck, "update");
      const f = action.deck.start("deckId");
      await f(dispatch, getState, undefined);
      expect(update).lastCalledWith({ id: "deckId", currentIndex: 0, cardOrderIds: [] }, { noDelay: true });
      expect(dispatch).lastCalledWith(
        type.configUpdate({
          showBackText: false,
          autoPlay: true,
        })
      );
    });
  });

  describe("swip", () => {
    it("should swip", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({
        config: { uid: "uid" },
        deck: { byId: { deckId: { id: "deckId", currentIndex: 0, cardOrderIds: ["a", "b", "c"] } } },
        card: { byId: { a: { id: "a", interval: 60 * 24, numberOfSeen: 0, score: 0 } } },
      });

      const deckUpdate = vi.spyOn(action.deck, "update");
      const cardUpdate = vi.spyOn(action.card, "update");
      const f = action.deck.swipe("cardSwipeRight", "deckId");
      await f(dispatch, getState, undefined);

      expect(dispatch).toBeCalledTimes(3);
      expect(dispatch).toHaveBeenCalledWith(type.configUpdate({ lastSwipe: "cardSwipeRight" }));
      expect(deckUpdate).toHaveBeenCalledWith({ id: "deckId", currentIndex: 1 });
      expect(cardUpdate).toHaveBeenCalledWith({
        id: "a",
        score: 0,
        numberOfSeen: 1,
        interval: 60 * 24,
        lastSeenAt: mockedDate.getTime(),
        nextSeeingAt: moment(mockedDate).add(1, "day").toDate(),
      });
    });
  });

  describe("spliteCreate", () => {
    const deck = { name: "name" } as Deck;
    const deckState = { byId: { 1: deck }, categories: [] } as DeckState;
    const cardState = { byId: { 1: { uniqueKey: "a" } as Card }, tags: [] } as CardState;

    it("should splite & create", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ deck: deckState, card: cardState });

      const bulkUpdate = vi.spyOn(action.card, "bulkUpdate");
      const upsert = vi.spyOn(action.deck, "upsert");
      const create = vi.spyOn(action.deck, "create");

      const cards = [{ uniqueKey: "a" }] as Card[];
      const f = action.deck.spliteCreate("invalid", cards);
      await f(dispatch, getState, undefined);
      expect(bulkUpdate).lastCalledWith(cards);
      expect(upsert).toBeCalledTimes(0);
      expect(create).toBeCalledTimes(1);
      expect(dispatch).toBeCalledTimes(2);
    });
  });

  describe("parseUrl", () => {
    it("should parse url", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ config: {} });
      const spliteCreate = vi.spyOn(action.deck, "spliteCreate");
      global.fetch = vi.fn().mockReturnValue(Promise.resolve(new Response("front,back")));

      const url = "http://example.com/deck-name.csv";
      const f = action.deck.parseUrl(url);
      await f(dispatch, getState, undefined);
      expect(spliteCreate).toHaveBeenCalledWith("deck-name.csv", [
        { frontText: "front", backText: "back", uniqueKey: "", tags: [] as string[] },
      ] as Card[]);
      expect(dispatch).toBeCalledTimes(1);
    });
  });

  describe("parseFile", () => {
    it.skip("should parse file", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const spliteCreate = vi.spyOn(action.deck, "spliteCreate");

      const file = new File([new Blob(["front,back"])], "deck-name.csv");
      const f = action.deck.parseFile(file);
      await f(dispatch, getState, undefined);
      expect(spliteCreate).toHaveBeenCalledWith("deck-name.csv", [
        { frontText: "front", backText: "back", uniqueKey: "", tags: [] as string[] },
      ] as Card[]);
      expect(dispatch).toBeCalledTimes(1);
    });
  });

  describe("download", () => {
    it("should download", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const blob = new Blob();
      const m = vi.spyOn(global, "Blob"); // FIXME: affect Blob after this test
      m.mockImplementation(() => blob);
      getState.mockReturnValue({ deck: { byId: { id: { name: "name", cardIds: [] } } }, card: { byId: {} } });

      const f = action.deck.download("id");
      await f(dispatch, getState, undefined);
      expect(m).toBeCalledWith([""], { type: "text/plain;charset=utf-8" });
      expect(fileSaver.saveAs).toBeCalledWith(expect.anything(), "name.csv");
    });
  });

  describe("splitByUniqueKey", () => {
    const state = {
      byId: {
        1: { uniqueKey: "a" } as Card,
        2: { uniqueKey: "b" } as Card,
        3: { uniqueKey: "c" } as Card,
      },
      tags: [],
    } as CardState;

    it("should split into new cards", async () => {
      const cards = [{ uniqueKey: "A" }, { uniqueKey: "B" }, { uniqueKey: "C" }] as Card[];
      const [newCards, oldCards] = action.deck.splitByUniqueKey(cards, state);
      expect(newCards).toEqual(cards);
      expect(oldCards).toEqual([]);
    });

    it("should split into old cards", async () => {
      const cards = [{ uniqueKey: "a" }, { uniqueKey: "b" }, { uniqueKey: "c" }] as Card[];
      const [newCards, oldCards] = action.deck.splitByUniqueKey(cards, state);
      expect(newCards).toEqual([]);
      expect(oldCards).toEqual(cards);
    });

    it("should split into new and old cards", async () => {
      const cards = [{ uniqueKey: "A" }, { uniqueKey: "b" }, { uniqueKey: "c" }] as Card[];
      const [newCards, oldCards] = action.deck.splitByUniqueKey(cards, state);
      expect(newCards).toEqual(cards.slice(0, 1));
      expect(oldCards).toEqual(cards.slice(1, 3));
    });
  });
});
