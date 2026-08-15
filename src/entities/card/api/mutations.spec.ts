import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture, createDeck as createDeckFixture } from "@/test/factories";

import { createCard, deleteCard, editCard } from "./mutations";
import { cardStore, findCardById } from "../model/store";

const mocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
  findDeckById: vi.fn(),
}));

vi.mock("./firestore", () => ({
  createCard: mocks.createRemoteCard,
  deleteCard: mocks.deleteRemoteCard,
  editCard: mocks.editRemoteCard,
}));

vi.mock("@/entities/deck/@x/card", () => ({
  findDeckById: mocks.findDeckById,
}));

describe("Card mutations", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    vi.resetAllMocks();
  });

  it("routes Card create, edit, and delete by its local parent Deck", async () => {
    const deck = createDeckFixture({ id: "local-deck", localMode: true });
    const card = createCardFixture({ id: "local-card", deckId: deck.id });
    mocks.findDeckById.mockReturnValue(deck);

    await createCard("", card);
    await editCard("", { id: card.id, uid: card.uid, frontText: "Updated" });

    expect(findCardById(card.id)).toMatchObject({ id: card.id, frontText: "Updated" });
    expect(mocks.createRemoteCard).not.toHaveBeenCalled();
    expect(mocks.editRemoteCard).not.toHaveBeenCalled();

    await deleteCard("", card);

    expect(findCardById(card.id)).toBeUndefined();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });

  it("preserves remote Card mutation behavior", async () => {
    const deck = createDeckFixture({ id: "remote-deck", localMode: false });
    const card = createCardFixture({ id: "remote-card", deckId: deck.id });
    const edit = { id: card.id, uid: card.uid, frontText: "Updated" };
    mocks.findDeckById.mockReturnValue(deck);
    cardStore.setState({ remoteCards: [card] });

    await createCard("uid", card);
    await editCard("uid", edit);
    await deleteCard("uid", card);

    expect(mocks.createRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", card);
    expect(mocks.editRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", edit);
    expect(mocks.deleteRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", card);
  });

  it("rejects edit and delete when the Card cannot be resolved", async () => {
    const card = createCardFixture({ id: "missing" });

    await expect(editCard("uid", { id: card.id, uid: card.uid, frontText: "Updated" })).rejects.toThrow(
      'Card "missing" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Card "missing" was not found');

    expect(mocks.editRemoteCard).not.toHaveBeenCalled();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });

  it("rejects edit and delete when the Card parent Deck cannot be resolved", async () => {
    const card = createCardFixture({ id: "orphan", deckId: "missing-deck" });
    cardStore.setState({ remoteCards: [card] });

    await expect(editCard("uid", { id: card.id, uid: card.uid, frontText: "Updated" })).rejects.toThrow(
      'Deck "missing-deck" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Deck "missing-deck" was not found');

    expect(mocks.editRemoteCard).not.toHaveBeenCalled();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });
});
