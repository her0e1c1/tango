import { beforeEach, describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { findDeckById, getDecks, mustFindDeckById } from "./queries";
import { applyDeckSnapshot, clearRemoteDecks } from "./store";

beforeEach(() => clearRemoteDecks());

describe("Deck lookup [DECK-MANAGEMENT-01]", () => {
  it("returns the requested deck from the current collection", () => {
    const target = createDeck({ id: "target" });
    applyDeckSnapshot([createDeck({ id: "other" }), target]);

    expect(findDeckById(target.id)).toEqual(target);
    expect(mustFindDeckById(target.id)).toEqual(target);
  });

  it.each(["missing", ""])("preserves optional and required lookup failures for '%s'", (id) => {
    expect(findDeckById(id)).toBeUndefined();
    expect(() => mustFindDeckById(id)).toThrow(`Deck not found: ${id}`);
  });
});

describe("Deck clearing [UNIT-STORE-DECK-02]", () => {
  it.each([{ decks: [] }, { decks: [createDeck({ id: "A" }), createDeck({ id: "B" })] }])(
    "stops resolving previously held decks after clearing: %j",
    ({ decks }) => {
      applyDeckSnapshot(decks);
      clearRemoteDecks();

      expect(getDecks()).toEqual([]);
      expect(findDeckById("A")).toBeUndefined();
      expect(findDeckById("B")).toBeUndefined();
      expect(() => mustFindDeckById("A")).toThrow("Deck not found: A");
    }
  );
});
