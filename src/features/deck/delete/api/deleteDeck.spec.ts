import type { Deck } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteDocuments: vi.fn(),
}));

vi.mock("./firestore", () => ({ deleteDeckDocuments: mocks.deleteDocuments }));

import { deleteDeck } from "./deleteDeck";

describe("deleteDeck", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" }) as Deck;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteDocuments.mockResolvedValue(undefined);
  });

  it("deletes the owned Deck and its documents", async () => {
    await deleteDeck("uid-a", deck);
    expect(mocks.deleteDocuments).toHaveBeenCalledExactlyOnceWith("uid-a", deck.id);
  });

  it("keeps the Deck when Card deletion fails", async () => {
    mocks.deleteDocuments.mockRejectedValue(new Error("card deletion failed"));
    await expect(deleteDeck("uid-a", deck)).rejects.toThrow("card deletion failed");
  });

  it("rejects a mismatched owner before deleting", async () => {
    await expect(deleteDeck("uid-b", deck)).rejects.toThrow("owner does not match");
    expect(mocks.deleteDocuments).not.toHaveBeenCalled();
  });
});
