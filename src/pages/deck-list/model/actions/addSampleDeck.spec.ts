import type { Card, CardMutation } from "@/entities/card";
import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
  loadSample: true,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => repository.uid }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    mutateCards: (_uid: string, mutations: CardMutation[]) => {
      const createdCards = mutations.flatMap((mutation) => (mutation.kind === "create" ? [mutation.card as Card] : []));
      const createdIds = new Set(createdCards.map((card) => card.id));
      repository.cards = [...repository.cards.filter((card) => !createdIds.has(card.id)), ...createdCards];
      return Promise.resolve();
    },
    useCards: () => repository.cards,
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    createDeck: (_uid: string, deck: RemoteDeckCreateInput) => {
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
      const savedDeck: Deck = { ...fields, uid: repository.uid };
      repository.decks = [...repository.decks.filter(({ id }) => id !== savedDeck.id), savedDeck];
      return Promise.resolve();
    },
    useDecks: () => repository.decks,
  };
});
vi.mock("@/entities/preference", () => ({
  updatePreferences: (preferences: { loadSample?: boolean }) => {
    if (preferences.loadSample !== undefined) repository.loadSample = preferences.loadSample;
  },
  usePreferences: () => ({ loadSample: repository.loadSample }),
}));

import { addSampleDeck } from "./addSampleDeck";

describe("addSampleDeck [IMPORT-07]", () => {
  beforeEach(() => {
    repository.uid = "uid-a";
    repository.cards = [];
    repository.decks = [];
    repository.loadSample = true;
  });

  it("creates a sample deck and card mutations for the current user", async () => {
    const result = await addSampleDeck();

    expect(result.created).toBeGreaterThan(0);
    expect(result.deckId).toBe(`${repository.uid}-sample-v1`);
    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toEqual([
      expect.objectContaining({ id: `${repository.uid}-sample-v1`, name: "Sample Deck" }),
    ]);
    expect(repository.cards).toHaveLength(result.created);
    expect(repository.cards.every((card) => card.deckId === `${repository.uid}-sample-v1`)).toBe(true);
  });

  it("persists locally without a signed-in user", async () => {
    repository.uid = "anonymous-uid";

    const result = await addSampleDeck();

    expect(result.created).toBeGreaterThan(0);
    expect(result.deckId).toBe(`${repository.uid}-sample-v1`);
    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toEqual([
      expect.objectContaining({ id: `${repository.uid}-sample-v1`, name: "Sample Deck" }),
    ]);
    expect(repository.cards.length).toBeGreaterThan(0);
    expect(repository.cards.every((card) => card.deckId === `${repository.uid}-sample-v1` && !("uid" in card))).toBe(
      true
    );
  });
});

vi.mock("@/entities/card/model/queries/useCards", () => ({ useCards: () => repository.cards }));
