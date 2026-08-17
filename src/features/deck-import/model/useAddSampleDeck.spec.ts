import type { Card, CardMutation } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const repository = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
  nextCardNumber: 1,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => repository.uid }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    generateCardId: () => {
      const cardNumber = repository.nextCardNumber;
      repository.nextCardNumber += 1;
      return `sample-card-${String(cardNumber)}`;
    },
    mutateCards: (_uid: string, mutations: CardMutation[]) => {
      repository.cards = [
        ...repository.cards,
        ...mutations.flatMap((mutation) => (mutation.kind === "create" ? [mutation.card as Card] : [])),
      ];
      return Promise.resolve();
    },
    useCards: () => repository.cards,
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    createDeck: (_uid: string, deck: DeckCreateInput) => {
      const savedDeck: Deck = {
        id: deck.id,
        name: deck.name,
        scoreMax: deck.scoreMax ?? null,
        scoreMin: deck.scoreMin ?? null,
        selectedTags: deck.selectedTags ?? [],
        tagAndFilter: deck.tagAndFilter ?? false,
        category: deck.category ?? "",
        convertToBr: deck.convertToBr ?? false,
        createdAt: 0,
        updatedAt: 0,
        localMode: false,
      };
      repository.decks = [...repository.decks, savedDeck];
      return Promise.resolve();
    },
    useDecks: () => repository.decks,
  };
});

import { useAddSampleDeck } from "./useAddSampleDeck";

describe("useAddSampleDeck", () => {
  beforeEach(() => {
    repository.uid = "uid-a";
    repository.cards = [];
    repository.decks = [];
    repository.nextCardNumber = 1;
  });

  it("leaves storage empty for a signed-out user", () => {
    repository.uid = "";

    renderHook(useAddSampleDeck);

    expect(repository.decks).toEqual([]);
    expect(repository.cards).toEqual([]);
  });

  it("preserves existing storage without adding a sample", () => {
    const existingDeck = createDeck({ id: "existing-deck", uid: repository.uid, name: "Existing Deck" });
    repository.decks = [existingDeck];

    renderHook(useAddSampleDeck);

    expect(repository.decks).toEqual([existingDeck]);
    expect(repository.cards).toEqual([]);
  });

  it("persists one account-synced sample when storage has no Decks", async () => {
    renderHook(useAddSampleDeck);

    await waitFor(() => expect(repository.cards.length).toBeGreaterThan(0));

    expect(repository.decks).toEqual([
      expect.objectContaining({
        id: "sample-v1-uid-a",
        name: "Sample Deck",
        localMode: false,
      }),
    ]);
    expect(repository.cards.every((card) => card.deckId === "sample-v1-uid-a")).toBe(true);
    expect(repository.cards.every((card) => "uid" in card && card.uid === "uid-a")).toBe(true);
  });
});
