import type { Card, CardMutation } from "@/entities/card";
import type { Deck, LocalDeckCreateInput, RemoteDeckCreateInput } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

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
    createDeck: (_uid: string, deck: RemoteDeckCreateInput | LocalDeckCreateInput) => {
      const fields = {
        id: deck.id,
        name: deck.name,
        isPublic: deck.isPublic ?? false,
        difficultyMax: deck.difficultyMax ?? null,
        difficultyMin: deck.difficultyMin ?? null,
        selectedTags: deck.selectedTags ?? [],
        tagAndFilter: deck.tagAndFilter ?? false,
        category: deck.category ?? "",
        convertToBr: deck.convertToBr ?? false,
        createdAt: 0,
        updatedAt: 0,
      };
      const savedDeck: Deck = deck.localMode
        ? { ...fields, localMode: true }
        : { ...fields, uid: repository.uid, localMode: false };
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

import { bootstrapSampleDeck } from "./bootstrapSampleDeck";

describe("bootstrapSampleDeck [IMPORT-07]", () => {
  beforeEach(() => {
    repository.uid = "uid-a";
    repository.cards = [];
    repository.decks = [];
    repository.loadSample = true;
  });

  it("persists the sample locally without a signed-in user", async () => {
    repository.uid = "";

    await bootstrapSampleDeck(repository.uid, repository.decks, repository.loadSample);

    expect(repository.loadSample).toBe(false);

    expect(repository.decks).toEqual([
      expect.objectContaining({ id: "sample-v1", name: "Sample Deck", localMode: true }),
    ]);
    expect(repository.cards.length).toBeGreaterThan(0);
    expect(repository.cards.every((card) => card.deckId === "sample-v1" && !("uid" in card))).toBe(true);
  });

  it("preserves existing storage without adding a sample", async () => {
    const existingDeck = createDeck({ id: "existing-deck", uid: repository.uid, name: "Existing Deck" });
    repository.decks = [existingDeck];

    await bootstrapSampleDeck(repository.uid, repository.decks, repository.loadSample);

    expect(repository.decks).toEqual([existingDeck]);
    expect(repository.cards).toEqual([]);
    expect(repository.loadSample).toBe(true);
  });

  it("does not add a sample when automatic loading is disabled", async () => {
    repository.loadSample = false;

    await bootstrapSampleDeck(repository.uid, repository.decks, repository.loadSample);

    expect(repository.decks).toEqual([]);
    expect(repository.cards).toEqual([]);
  });

  it("converges repeated bootstrap attempts and stays disabled after the sample is removed", async () => {
    await Promise.all([bootstrapSampleDeck(repository.uid, [], true), bootstrapSampleDeck(repository.uid, [], true)]);

    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toHaveLength(1);
    expect(new Set(repository.cards.map((card) => card.uniqueKey)).size).toBe(repository.cards.length);

    repository.decks = [];
    repository.cards = [];
    await bootstrapSampleDeck(repository.uid, repository.decks, repository.loadSample);

    expect(repository.decks).toEqual([]);
    expect(repository.cards).toEqual([]);
  });
});
