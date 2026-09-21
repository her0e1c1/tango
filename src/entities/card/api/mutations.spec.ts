import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture, createDeck as createDeckFixture } from "@/test/factories";
const mocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
  findDeckById: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck/@x/card", () => ({
  findDeckById: mocks.findDeckById,
  getDecks: () => [createDeckFixture({ uid: "owner" })],
}));
vi.mock("./firestore", () => ({
  createCard: mocks.createRemoteCard,
  deleteCard: mocks.deleteRemoteCard,
  editCard: mocks.editRemoteCard,
}));

import { cardStore } from "../model/store";
import { createCard, deleteCard, editCard } from "./mutations";

describe("CARD-MANAGEMENT-02 Card mutations", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [] });
    localStorage.clear();
    vi.clearAllMocks();
    mocks.findDeckById.mockReset();
  });

  it.each(["anonymous-owner", "linked-owner"])("creates a Card for %s through Firestore", async (uid) => {
    mocks.findDeckById.mockReturnValue(createDeckFixture({ id: "deck", uid }));
    await createCard(uid, {
      id: "card",
      deckId: "deck",
      frontText: "Front",
      backText: "Back",
      tags: [],
      uniqueKey: "key",
    });
    expect(mocks.createRemoteCard).toHaveBeenCalledWith(uid, expect.objectContaining({ id: "card", uid }));
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
    await expect(deleteCard("uid", card.id)).rejects.toThrow('Card "missing" was not found');
  });

  it("rejects another owner's Card before editing or deleting", async () => {
    cardStore.setState({ remoteCards: [createCardFixture({ id: "card", uid: "owner" })] });
    await expect(editCard("other", { id: "card", frontText: "Updated" })).rejects.toThrow("owner does not match");
    await expect(deleteCard("other", "card")).rejects.toThrow("owner does not match");
    expect(mocks.editRemoteCard).not.toHaveBeenCalled();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });
});
