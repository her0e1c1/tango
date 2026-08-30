import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCard as createCardFixture,
  createDeck as createDeckFixture,
  createLocalCard,
  createLocalDeck,
} from "@/test/factories";
const mocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
  findDeckById: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck/@x/card", () => ({ findDeckById: mocks.findDeckById }));
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
    localStorage.clear();
    vi.clearAllMocks();
    mocks.findDeckById.mockReset();
  });

  it("creates one Card through the owning Deck persistence mode", async () => {
    const localDeck = createLocalDeck({ id: "local-deck" });
    const remoteDeck = createDeckFixture({ id: "remote-deck", uid: "owner" });
    mocks.findDeckById.mockImplementation((id) =>
      id === localDeck.id ? localDeck : id === remoteDeck.id ? remoteDeck : undefined
    );

    await createCard("", {
      id: "local-card",
      deckId: localDeck.id,
      frontText: "Local front",
      backText: "Local back",
      tags: ["custom"],
      uniqueKey: "local-card",
    });
    await createCard("owner", {
      id: "remote-card",
      deckId: remoteDeck.id,
      frontText: "Remote front",
      backText: "Remote back",
      tags: [],
      uniqueKey: "remote-card",
    });

    expect(cardStore.getState().localCards).toEqual([
      expect.objectContaining({ id: "local-card", deckId: localDeck.id, tags: ["custom"] }),
    ]);
    expect(mocks.createRemoteCard).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining({ id: "remote-card", deckId: remoteDeck.id, uid: "owner" })
    );
  });

  it("rejects an unknown Deck and a mismatched remote owner before writing", async () => {
    const card = {
      id: "card",
      deckId: "missing",
      frontText: "Front",
      backText: "Back",
      tags: [],
      uniqueKey: "card",
    };

    await expect(createCard("owner", card)).rejects.toThrow('Deck "missing" was not found');

    const remoteDeck = createDeckFixture({ id: "remote-deck", uid: "owner" });
    mocks.findDeckById.mockReturnValue(remoteDeck);
    await expect(createCard("other", { ...card, deckId: "remote-deck" })).rejects.toThrow(
      "Deck owner does not match the authenticated user"
    );
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
