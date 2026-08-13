import type { Deck } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  removeCards: vi.fn(),
  removeDeck: vi.fn(),
}));

vi.mock("@/entities/card", () => ({ removeCardDocumentsForDeck: mocks.removeCards }));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  removeDeckDocument: mocks.removeDeck,
}));

import { deleteDeck } from "./deleteDeck";

describe("deleteDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" }) as Deck;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.removeCards.mockResolvedValue(undefined);
    mocks.removeDeck.mockResolvedValue(undefined);
  });

  it("deletes child Cards before deleting the Deck", async () => {
    await deleteDeck("uid-a", deck);
    expect(mocks.removeCards).toHaveBeenCalledExactlyOnceWith("uid-a", deck.id);
    expect(mocks.removeDeck).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(mocks.removeCards.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.removeDeck.mock.invocationCallOrder[0] ?? 0
    );
  });

  it("keeps the Deck when Card deletion fails", async () => {
    mocks.removeCards.mockRejectedValue(new Error("card deletion failed"));
    await expect(deleteDeck("uid-a", deck)).rejects.toThrow("card deletion failed");
    expect(mocks.removeDeck).not.toHaveBeenCalled();
  });

  it("rejects a mismatched owner before deleting", async () => {
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
    expect(mocks.removeCards).not.toHaveBeenCalled();
  });
});
