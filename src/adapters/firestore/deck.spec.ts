/**
 * @file Verifies Deck persistence DTOs, narrow filter patches, server deletion delegation, and
 * batching helpers.
 */

import "./init";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { v4 as uuid } from "uuid";

const mocks = vi.hoisted(() => ({ removeDeck: vi.fn() }));
vi.mock("@/adapters/functions/deck", () => ({ removeDeck: mocks.removeDeck }));
vi.mock("./documentMetadata", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./documentMetadata")>()),
  getTimestamp: vi.fn(),
}));

import * as deckAdapter from "@/adapters/firestore/deck";
import { getTimestamp } from "@/adapters/firestore/documentMetadata";
import { createCard, createDeck } from "@/test/factories";

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = createDeck({
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  beforeEach(() => {
    (getTimestamp as Mock).mockReturnValue(timestamp);
    mocks.removeDeck.mockResolvedValue(undefined);
  });

  it("creates a Deck using only persisted fields", async () => {
    const deck = {
      ...newDeck,
      id: uuid(),
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };

    await deckAdapter.create(deck);

    const data = (await getDoc(doc(db, "deck", deck.id))).data();
    expect(data).toEqual({ ...newDeck, id: deck.id });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect(await deckAdapter.exists(deck.id)).toBeTruthy();
  });

  it("updates a Deck using only persisted fields", async () => {
    const deck = { ...newDeck, id: uuid() };
    await deckAdapter.create(deck);
    const edited = {
      ...deck,
      name: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };

    await deckAdapter.update(edited);

    const data = (await getDoc(doc(db, "deck", deck.id))).data();
    expect(data).toEqual({ ...deck, name: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("updates only filter fields and preserves concurrent Deck edits", async () => {
    const deck = { ...newDeck, id: uuid(), name: "latest name", category: "latest category" };
    await deckAdapter.create(deck);

    await deckAdapter.updateFilter(deck.id, {
      selectedTags: ["math"],
      tagAndFilter: true,
      scoreMin: -2,
      scoreMax: 3,
    });

    expect((await getDoc(doc(db, "deck", deck.id))).data()).toEqual({
      ...deck,
      selectedTags: ["math"],
      tagAndFilter: true,
      scoreMin: -2,
      scoreMax: 3,
    });
  });

  it("delegates destructive removal to the callable function", async () => {
    await deckAdapter.remove("deck-id");

    expect(mocks.removeDeck).toHaveBeenCalledExactlyOnceWith("deck-id");
  });

  describe("splitCards", () => {
    const cards = [...Array(5)].map((_, index) => createCard({ id: String(index) }));

    it("keeps a collection within the maximum in one chunk", () => {
      expect(deckAdapter.splitCards(cards, 5)).toEqual([cards]);
    });

    it("splits collections larger than the maximum", () => {
      expect(deckAdapter.splitCards(cards, 3)).toEqual([cards.slice(0, 3), cards.slice(3, 5)]);
      expect(deckAdapter.splitCards(cards, 2)).toEqual([cards.slice(0, 2), cards.slice(2, 4), cards.slice(4, 5)]);
    });

    it("returns no chunks for an empty collection or non-positive maximum", () => {
      expect(deckAdapter.splitCards(cards, 0)).toEqual([]);
      expect(deckAdapter.splitCards(cards, -1)).toEqual([]);
      expect(deckAdapter.splitCards([], 5)).toEqual([]);
    });

    it("rounds a positive fractional maximum up", () => {
      expect(deckAdapter.splitCards(cards, 2.5)).toEqual([cards.slice(0, 3), cards.slice(3, 5)]);
    });
  });
});
