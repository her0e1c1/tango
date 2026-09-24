import type { Card, CardMutation } from "@/entities/card";
import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
}));

vi.mock("@/shared/firebase", () => ({
  auth: {},
  db: {},
}));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => repository.uid }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    mutateCards: async (uid: string, mutations: CardMutation[]) => {
      await Promise.resolve();
      for (const mutation of mutations) {
        if (mutation.kind !== "create") continue;
        const saved: Card = {
          ...mutation.card,
          uid,
          deletedAt: mutation.card.deletedAt ?? null,
          fsrs: null,
          createdAt: 0,
          updatedAt: 0,
        };
        repository.cards = [...repository.cards.filter(({ id }) => id !== saved.id), saved];
      }
    },
    useCards: () => repository.cards,
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    createDeck: async (uid: string, deck: RemoteDeckCreateInput) => {
      await Promise.resolve();
      const fields = {
        id: deck.id,
        name: deck.name,
        isPublic: deck.isPublic ?? false,
        selectedTags: deck.selectedTags ?? [],
        tagAndFilter: deck.tagAndFilter ?? false,
        category: deck.category ?? "",
        convertToBr: deck.convertToBr ?? false,
        createdAt: 0,
        updatedAt: 0,
      };
      const savedDeck: Deck = { ...fields, uid };
      repository.decks = [...repository.decks.filter(({ id }) => id !== savedDeck.id), savedDeck];
    },
    useDecks: () => repository.decks,
  };
});

import { addSampleDeck } from "./addSampleDeck";

describe("addSampleDeck [DECK-IMPORT-07]", () => {
  beforeEach(() => {
    repository.uid = "uid-a";
    repository.cards = [];
    repository.decks = [];
  });

  it("creates a sample deck and Card writes for the current user", async () => {
    const result = await addSampleDeck();

    expect(result.created).toBeGreaterThan(0);
    expect(result.deckId).toBe(`${repository.uid}-sample-v1`);
    expect(repository.decks).toEqual([
      expect.objectContaining({ id: `${repository.uid}-sample-v1`, name: "Sample Deck" }),
    ]);
    expect(repository.cards).toHaveLength(result.created);
    expect(repository.cards.every((card) => card.deckId === `${repository.uid}-sample-v1`)).toBe(true);
  });

  it("creates a sample Deck and Cards for an anonymous user", async () => {
    repository.uid = "anonymous-uid";

    const result = await addSampleDeck();

    expect(result.created).toBeGreaterThan(0);
    expect(result.deckId).toBe(`${repository.uid}-sample-v1`);
    expect(repository.decks).toEqual([
      expect.objectContaining({ id: `${repository.uid}-sample-v1`, name: "Sample Deck" }),
    ]);
    expect(repository.cards.length).toBeGreaterThan(0);
    expect(repository.cards.every((card) => card.deckId === `${repository.uid}-sample-v1`)).toBe(true);
  });
});

vi.mock("@/entities/card/model/queries/useCards", () => ({ useCards: () => repository.cards }));
