import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCard as createCardFixture,
  createDeck as createDeckFixture,
  createLocalCard,
  createLocalDeck,
} from "@/test/factories";
const mocks = vi.hoisted(() => ({
  deck: undefined as { id: string; localMode: boolean } | undefined,
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck/@x/card", () => ({ findDeckById: () => mocks.deck }));
vi.mock("./firestore", () => ({
  createCard: mocks.createRemoteCard,
  deleteCard: mocks.deleteRemoteCard,
  editCard: mocks.editRemoteCard,
}));

import { cardStore } from "../model/store";
import { createCard, deleteCard, editCard, moveLocalCardsToRemote } from "./mutations";

describe("Card mutations", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    mocks.deck = undefined;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("routes create through the current parent Deck persistence mode", async () => {
    const localDeck = createLocalDeck({ id: "local-deck" });
    mocks.deck = localDeck;

    await createCard("", {
      id: "local-card",
      deckId: localDeck.id,
      frontText: "Local front",
      backText: "Local back",
      tags: [],
      uniqueKey: "local-card",
    });

    expect(cardStore.getState().localCards).toContainEqual(
      expect.objectContaining({ id: "local-card", deckId: localDeck.id })
    );
    expect(mocks.createRemoteCard).not.toHaveBeenCalled();

    const remoteDeck = createDeckFixture({ id: "remote-deck", uid: "owner" });
    mocks.deck = remoteDeck;
    await createCard("owner", {
      id: "remote-card",
      deckId: remoteDeck.id,
      uid: remoteDeck.uid,
      frontText: "Remote front",
      backText: "Remote back",
      tags: [],
      uniqueKey: "remote-card",
    });

    expect(mocks.createRemoteCard).toHaveBeenCalledExactlyOnceWith(
      "owner",
      expect.objectContaining({ id: "remote-card", deckId: remoteDeck.id, uid: remoteDeck.uid })
    );
  });

  it("rejects create when the parent Deck is missing or stale", async () => {
    await expect(
      createCard("owner", {
        id: "orphan-card",
        deckId: "missing-deck",
        uid: "owner",
        frontText: "Front",
        backText: "Back",
        tags: [],
        uniqueKey: "orphan-card",
      })
    ).rejects.toThrow('Deck "missing-deck" was not found');
    expect(mocks.createRemoteCard).not.toHaveBeenCalled();
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
