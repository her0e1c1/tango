import { expect, it, describe, vi, beforeEach } from "vitest";

import * as card from "./card";
import * as action from ".";
import * as firestore from "./firestore";

vi.mock("./firestore");
vi.mock("firebase/firestore", () => ({
  ...Object.keys(vi.importActual("firebase/firestore")).reduce((acc, key) => ({ ...acc, [key]: vi.fn() }), {}),
  getFirestore: vi.fn(() => "db"),
}));

describe("card action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  describe("fromRow", () => {
    it("should be fromRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.fromRow(["front", "back", "a,b,c", "123"])).toEqual(c);
    });
    it("should be empty", async () => {
      const c = { frontText: "", backText: "", tags: [], uniqueKey: "" } as unknown as Card;
      expect(card.fromRow([])).toEqual(c);
    });
  });

  describe("toRow", () => {
    it("should be toRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.toRow(c)).toEqual(["front", "back", "a,b,c", "123"]);
    });
    it("should be empty", async () => {
      const c = { frontText: "", backText: "", tags: [], uniqueKey: "" } as unknown as Card;
      expect(card.toRow(c)).toEqual(["", "", "", ""]);
    });
  });

  describe("goTo", () => {
    it("should goTo index", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];

      const id = "id";
      const c = { id, deckId: id } as Card;
      const d = { id, cardOrderIds: ["a", id, "b"] } as Deck;
      getState.mockReturnValue({
        card: { byId: { [id]: c } },
        deck: { byId: { [id]: d } },
      });

      const m = vi.spyOn(action.deck, "update");

      const f = card.goTo(id);
      await f(dispatch, getState, undefined);
      expect(m).lastCalledWith({ id, currentIndex: 1 });
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];

      const c = { id: "id" } as Card;
      const f = card.update(c);
      await f(dispatch, getState, undefined);
      expect(firestore.card.update).lastCalledWith(c);
    });
  });

  describe("remove", () => {
    it("should remove", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const [id, deckId] = ["id", "deckId"];
      const c = { id, deckId } as Card;
      getState.mockReturnValue({ card: { byId: { id: c } } });

      const f = card.remove(id);
      await f(dispatch, getState, undefined);
      expect(firestore.card.logicalRemove).lastCalledWith(id);
    });
  });

  describe("filterCardsForUpdate", () => {
    const state = {
      byId: {
        1: { uniqueKey: "a", frontText: "front", backText: "back" } as Card,
      },
      tags: [],
    } as CardState;

    it("should filter an old card with invalid key", async () => {
      const card = { uniqueKey: "z" } as Card;
      const filtered = action.card.filterCardsForUpdate([card], state);
      expect(filtered).toEqual([]);
    });

    it("should filter an old card with the same text", async () => {
      const card = { uniqueKey: "a", frontText: "front", backText: "back" } as Card;
      const filtered = action.card.filterCardsForUpdate([card], state);
      expect(filtered).toEqual([]);
    });

    it("should not filter an old card", async () => {
      const card = { uniqueKey: "a" } as Card;
      const filtered = action.card.filterCardsForUpdate([card], state);
      expect(filtered).toEqual([{ uniqueKey: "a", id: "1", frontText: "front", backText: "back" } as Card]);
    });

    it("should not filter an old card and overwrite", async () => {
      const card = { uniqueKey: "a", frontText: "f", backText: "b" } as Card;
      const filtered = action.card.filterCardsForUpdate([card], state);
      expect(filtered).toEqual([{ uniqueKey: "a", id: "1", frontText: "f", backText: "b" } as Card]);
    });
  });
});
