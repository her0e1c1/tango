import type { Card, CardMutation } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
  createDeck: vi.fn<(_uid: string, _deck: DeckCreateInput) => Promise<unknown>>(),
  generateCardId: vi.fn(() => crypto.randomUUID()),
  mutateCards: vi.fn<(_uid: string, _mutations: CardMutation[]) => Promise<void>>(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => mocks.uid }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    generateCardId: mocks.generateCardId,
    mutateCards: mocks.mutateCards,
    useCards: () => mocks.cards,
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return { ...actual, createDeck: mocks.createDeck, useDecks: () => mocks.decks };
});

import { useAddSampleDeck } from "./sampleDeck";

describe("useAddSampleDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.cards = [];
    mocks.decks = [];
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.mutateCards.mockResolvedValue(undefined);
  });

  it("does not add a sample for a signed-out user", () => {
    mocks.uid = "";

    renderHook(useAddSampleDeck);

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.mutateCards).not.toHaveBeenCalled();
  });

  it("does not add a sample when the user already has a Deck", () => {
    mocks.decks = [createDeck({ uid: "uid-a" })];

    renderHook(useAddSampleDeck);

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.mutateCards).not.toHaveBeenCalled();
  });

  it("adds the sample when the user has no Decks", async () => {
    renderHook(useAddSampleDeck);

    await waitFor(() =>
      expect(mocks.createDeck).toHaveBeenCalledWith(
        "uid-a",
        expect.objectContaining({ id: "sample-v1-uid-a", name: "Sample Deck", uid: "uid-a" })
      )
    );
    expect(mocks.mutateCards).toHaveBeenCalledOnce();
  });
});
