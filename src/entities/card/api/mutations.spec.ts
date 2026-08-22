import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture, createLocalCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("./firestore", () => ({
  createCard: mocks.createRemoteCard,
  deleteCard: mocks.deleteRemoteCard,
  editCard: mocks.editRemoteCard,
}));

import { cardStore } from "../model/store";
import { deleteCard, editCard, moveLocalCardsToRemote } from "./mutations";

describe("Card mutations", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("rejects edit and delete when the Card cannot be resolved", async () => {
    const card = createCardFixture({ id: "missing" });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Card "missing" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Card "missing" was not found');
  });

  it("rejects edit and delete when the Card parent Deck cannot be resolved", async () => {
    const card = createCardFixture({ id: "orphan", deckId: "missing-deck" });
    cardStore.setState({ remoteCards: [card] });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Deck "missing-deck" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Deck "missing-deck" was not found');
  });

  it("moves every local Card for a Deck to remote persistence before deleting local copies", async () => {
    const cards = [
      createLocalCard({ id: "first", deckId: "deck" }),
      createLocalCard({ id: "second", deckId: "deck" }),
      createLocalCard({ id: "other", deckId: "other-deck" }),
    ];
    cardStore.setState({ localCards: cards });

    await moveLocalCardsToRemote("uid", "deck");

    expect(mocks.createRemoteCard).toHaveBeenCalledTimes(2);
    expect(mocks.createRemoteCard).toHaveBeenCalledWith(
      "uid",
      expect.objectContaining({ id: "first", deckId: "deck", uid: "uid" })
    );
    expect(mocks.createRemoteCard.mock.calls[0]?.[1]).not.toHaveProperty("createdAt");
    expect(mocks.createRemoteCard.mock.calls[0]?.[1]).not.toHaveProperty("updatedAt");
    expect(cardStore.getState().localCards).toEqual([cards[2]]);
  });
});
