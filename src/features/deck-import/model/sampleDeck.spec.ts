import type { CardMutation } from "@/entities/card";
import type { DeckCreateInput } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  mutateCards: vi.fn<(_uid: string, _mutations: CardMutation[]) => Promise<void>>(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return { ...actual, mutateCards: mocks.mutateCards };
});

import { addSampleDeck } from "./sampleDeck";

describe("addSampleDeck", () => {
  const createRemoteDeck = vi.fn<(_uid: string, _deck: DeckCreateInput) => Promise<void>>();
  const generateCardId = vi.fn(() => crypto.randomUUID());

  beforeEach(() => {
    vi.clearAllMocks();
    createRemoteDeck.mockResolvedValue(undefined);
    mocks.mutateCards.mockResolvedValue(undefined);
  });

  it("does not add a sample for a signed-out user", async () => {
    await addSampleDeck("", { cards: [], createDeck: createRemoteDeck, decks: [], generateCardId });

    expect(createRemoteDeck).not.toHaveBeenCalled();
    expect(mocks.mutateCards).not.toHaveBeenCalled();
  });

  it("does not add a sample when the user already has a Deck", async () => {
    const deck = createDeck({ uid: "uid-a" });

    await addSampleDeck("uid-a", { cards: [], createDeck: createRemoteDeck, decks: [deck], generateCardId });

    expect(createRemoteDeck).not.toHaveBeenCalled();
    expect(mocks.mutateCards).not.toHaveBeenCalled();
  });

  it("adds the sample when the user has no Decks", async () => {
    await addSampleDeck("uid-a", { cards: [], createDeck: createRemoteDeck, decks: [], generateCardId });

    expect(createRemoteDeck).toHaveBeenCalledWith(
      "uid-a",
      expect.objectContaining({ id: "sample-v1-uid-a", name: "Sample Deck", uid: "uid-a" })
    );
    expect(mocks.mutateCards).toHaveBeenCalledOnce();
  });
});
