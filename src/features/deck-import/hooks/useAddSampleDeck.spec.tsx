import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  cards: [] as Card[],
  decks: [] as Deck[],
  createDeck: vi.fn<(_uid: string, _deck: DeckCreateInput) => Promise<unknown>>(),
  generateCardId: vi.fn(() => "card-id"),
  addSampleDeck: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => mocks.uid }));
vi.mock("@/entities/card", () => ({
  generateCardId: mocks.generateCardId,
  useCards: () => mocks.cards,
}));
vi.mock("@/entities/deck", () => ({
  createDeck: mocks.createDeck,
  useDecks: () => mocks.decks,
}));
vi.mock("../model/sampleDeck", () => ({ addSampleDeck: mocks.addSampleDeck }));

import { useAddSampleDeck } from "./useAddSampleDeck";

describe("useAddSampleDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.cards = [];
    mocks.decks = [];
    mocks.addSampleDeck.mockResolvedValue(undefined);
  });

  it("provides the current Deck state and persistence dependencies", async () => {
    renderHook(useAddSampleDeck);

    await waitFor(() =>
      expect(mocks.addSampleDeck).toHaveBeenCalledExactlyOnceWith("uid-a", {
        cards: mocks.cards,
        createDeck: mocks.createDeck,
        decks: mocks.decks,
        generateCardId: mocks.generateCardId,
      })
    );
  });

  it("tries again when the Deck state changes", async () => {
    const { rerender } = renderHook(useAddSampleDeck);
    await waitFor(() => expect(mocks.addSampleDeck).toHaveBeenCalledOnce());

    mocks.decks = [{ id: "deck-a" } as Deck];
    rerender();

    await waitFor(() => expect(mocks.addSampleDeck).toHaveBeenCalledTimes(2));
  });
});
