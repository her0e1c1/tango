import type { Card, CardMutation } from "@/entities/card";
import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const repository = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
  loadSample: true,
  createDeckError: false,
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
      if (repository.createDeckError) throw new Error("Storage quota exceeded");
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
    getDecks: () => repository.decks,
  };
});
vi.mock("@/entities/preference", () => ({
  updatePreferences: (preferences: { loadSample?: boolean }) => {
    if (preferences.loadSample !== undefined) repository.loadSample = preferences.loadSample;
  },
  getPreferences: () => ({ loadSample: repository.loadSample }),
}));

import { deckListStore } from "../store";
import { bootstrapSampleDeck } from "./bootstrapSampleDeck";

describe("bootstrapSampleDeck [DECK-IMPORT-07]", () => {
  beforeEach(() => {
    deckListStore.setState({ bootstrapStatus: "idle" });
    repository.uid = "uid-a";
    repository.cards = [];
    repository.decks = [];
    repository.loadSample = true;
    repository.createDeckError = false;
  });

  it("persists the sample locally without a signed-in user", async () => {
    repository.uid = "anonymous-uid";

    await bootstrapSampleDeck();

    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toEqual([
      expect.objectContaining({ id: `${repository.uid}-sample-v1`, name: "Sample Deck" }),
    ]);
    expect(repository.cards.length).toBeGreaterThan(0);
    expect(repository.cards.every((card) => card.deckId === `${repository.uid}-sample-v1`)).toBe(true);
  });

  it("preserves existing storage without adding a sample", async () => {
    const existingDeck = createDeck({ id: "existing-deck", uid: repository.uid, name: "Existing Deck" });
    repository.decks = [existingDeck];

    await bootstrapSampleDeck();

    expect(repository.decks).toEqual([existingDeck]);
    expect(repository.cards).toEqual([]);
    expect(repository.loadSample).toBe(true);
  });

  it("does not add a sample when automatic loading is disabled", async () => {
    repository.loadSample = false;

    await bootstrapSampleDeck();

    expect(repository.decks).toEqual([]);
    expect(repository.cards).toEqual([]);
  });

  it("converges repeated bootstrap attempts and stays disabled after the sample is removed", async () => {
    await Promise.all([bootstrapSampleDeck(), bootstrapSampleDeck()]);

    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toHaveLength(1);
    expect(new Set(repository.cards.map((card) => card.uniqueKey)).size).toBe(repository.cards.length);

    repository.decks = [];
    repository.cards = [];
    await bootstrapSampleDeck();

    expect(repository.decks).toEqual([]);
    expect(repository.cards).toEqual([]);
    expect(deckListStore.getState().bootstrapStatus).toBe("done");
  });

  it("sets error status on failure and allows retry", async () => {
    repository.createDeckError = true;
    await bootstrapSampleDeck();

    expect(deckListStore.getState().bootstrapStatus).toBe("error");
    expect(repository.loadSample).toBe(true);

    repository.createDeckError = false;
    await bootstrapSampleDeck();

    expect(deckListStore.getState().bootstrapStatus).toBe("done");
    expect(repository.loadSample).toBe(false);
    expect(repository.decks).toHaveLength(1);
  });
});
