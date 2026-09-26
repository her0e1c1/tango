import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck } from "@/test/factories";
import { getDecks } from "@/entities/deck/@x/card";
import { findCardById, findCardsByDeckId, getCards, mustFindCardById } from "./queries";
import { applyCardSnapshot, clearRemoteCards } from "./store";

vi.mock("@/entities/deck/@x/card", () => ({ getDecks: vi.fn() }));

beforeEach(() => {
  clearRemoteCards();
  vi.mocked(getDecks).mockReturnValue([createDeck()]);
});

describe("Card lookup [CARD-VIEW-01]", () => {
  it("returns the requested card from the current collection", () => {
    const target = createCard({ id: "target" });
    applyCardSnapshot([createCard({ id: "other" }), target]);

    expect(findCardById(target.id)).toEqual(target);
    expect(mustFindCardById(target.id)).toEqual(target);
  });

  it("preserves optional and required lookup failures", () => {
    expect(findCardById("missing")).toBeUndefined();
    expect(() => mustFindCardById("missing")).toThrow("Card not found: missing");
    expect(() => findCardById("")).toThrow("Card id is required");
    expect(() => mustFindCardById("")).toThrow("Card not found: ");
  });

  it("returns only the requested deck's cards in collection order", () => {
    vi.mocked(getDecks).mockReturnValue([createDeck(), createDeck({ id: "other-deck" })]);
    const first = createCard({ id: "a" });
    const last = createCard({ id: "c" });
    applyCardSnapshot([last, createCard({ id: "b", deckId: "other-deck" }), first]);

    expect(findCardsByDeckId(first.deckId)).toEqual([first, last]);
    expect(findCardsByDeckId("missing")).toEqual([]);
  });
});

describe("Card visibility [UNIT-STORE-CARD-03]", () => {
  it.each([
    { decks: [createDeck({ id: "X", uid: "a" })], ids: ["A"] },
    { decks: [createDeck({ id: "X", uid: "b" })], ids: ["B"] },
    { decks: [], ids: [] },
  ])("reads the current visible decks: $ids", ({ decks, ids }) => {
    applyCardSnapshot([
      createCard({ id: "A", deckId: "X", uid: "a" }),
      createCard({ id: "B", deckId: "X", uid: "b" }),
      createCard({ id: "C", deckId: "Y", uid: "a" }),
    ]);
    vi.mocked(getDecks).mockReturnValue(decks);

    expect(getCards().map((card) => card.id)).toEqual(ids);
    expect(findCardsByDeckId("X").map((card) => card.id)).toEqual(ids);
    expect(findCardById("C")).toBeUndefined();
    expect(() => mustFindCardById("C")).toThrow("Card not found: C");
  });
});
