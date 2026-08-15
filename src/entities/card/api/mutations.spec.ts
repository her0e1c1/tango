import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture, createDeck as createDeckFixture } from "@/test/factories";

import { type CardBulkMutationError, type CardMutation, deleteCard, editCard, mutateCards } from "./mutations";
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

    await mutateCards("", [{ kind: "create", card }]);
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

    await mutateCards("uid", [{ kind: "create", card }]);
    await editCard("uid", edit);
    await deleteCard("uid", card);

    expect(mocks.createRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", card);
    expect(mocks.editRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", edit);
    expect(mocks.deleteRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", card);
  });

  it("executes each explicit Card mutation through the existing routing", async () => {
    const deck = createDeckFixture({ id: "remote-deck", localMode: false });
    const created = createCardFixture({ id: "created", deckId: deck.id });
    const edited = createCardFixture({ id: "edited", deckId: deck.id });
    const mutations = [
      { kind: "create", card: created },
      { kind: "edit", card: edited },
    ] satisfies CardMutation[];
    mocks.findDeckById.mockReturnValue(deck);
    cardStore.setState({ remoteCards: [edited], localCards: [] });

    await mutateCards("uid-a", mutations);

    expect(mocks.createRemoteCard).toHaveBeenCalledWith("uid-a", created);
    expect(mocks.editRemoteCard).toHaveBeenCalledWith("uid-a", edited);
  });

  it("reports every failed Card while allowing other writes to finish", async () => {
    const deck = createDeckFixture({ id: "remote-deck", localMode: false });
    const first = createCardFixture({ id: "first", deckId: deck.id });
    const second = createCardFixture({ id: "second", deckId: deck.id });
    mocks.findDeckById.mockReturnValue(deck);
    cardStore.setState({ remoteCards: [second], localCards: [] });
    mocks.createRemoteCard.mockRejectedValueOnce(new Error("create failed"));
    mocks.editRemoteCard.mockRejectedValueOnce(new Error("edit failed"));

    await expect(
      mutateCards("uid-a", [
        { kind: "create", card: first },
        { kind: "edit", card: second },
      ])
    ).rejects.toMatchObject({
      failedIds: [first.id, second.id],
      message: "2 of 2 Card writes failed",
    } satisfies Partial<CardBulkMutationError>);
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
