import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCard as createCardFixture,
  createDeck as createDeckFixture,
  createLocalCard,
  createLocalDeck,
} from "@/test/factories";

import type { CardMutation } from "../model/types";
import { cardStore, findCardById } from "../model/store";
import { deleteCard, editCard, mutateCards } from "./mutations";

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
    const deck = createLocalDeck({ id: "local-deck" });
    const card = createLocalCard({ id: "local-card", deckId: deck.id });
    mocks.findDeckById.mockReturnValue(deck);

    await mutateCards("", [{ kind: "create", card }]);
    await editCard("", { id: card.id, frontText: "Updated" });

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
    const edit = { id: card.id, frontText: "Updated" };
    mocks.findDeckById.mockReturnValue(deck);
    cardStore.setState({ remoteCards: [card] });

    await mutateCards("uid", [{ kind: "create", card }]);
    await editCard("uid", edit);
    await deleteCard("uid", card);

    expect(mocks.createRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", card);
    expect(mocks.editRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", { ...edit, uid: card.uid });
    expect(mocks.deleteRemoteCard).toHaveBeenCalledExactlyOnceWith("uid", { id: card.id, uid: card.uid });
  });

  it("rejects a remote Card create without an owner UID", async () => {
    const deck = createDeckFixture({ id: "remote-deck", localMode: false });
    const card = createLocalCard({ id: "ownerless-card", deckId: deck.id });
    mocks.findDeckById.mockReturnValue(deck);

    await expect(mutateCards("uid", [{ kind: "create", card }])).rejects.toThrow();

    expect(mocks.createRemoteCard).not.toHaveBeenCalled();
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

  it("waits for every Card mutation before rejecting with the first failure", async () => {
    const deck = createDeckFixture({ id: "remote-deck", localMode: false });
    const first = createCardFixture({ id: "first", deckId: deck.id });
    const second = createCardFixture({ id: "second", deckId: deck.id });
    let finishEdit!: () => void;
    mocks.findDeckById.mockReturnValue(deck);
    cardStore.setState({ remoteCards: [second], localCards: [] });
    mocks.createRemoteCard.mockRejectedValueOnce(new Error("create failed"));
    mocks.editRemoteCard.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishEdit = resolve;
      })
    );

    const mutation = mutateCards("uid-a", [
      { kind: "create", card: first },
      { kind: "edit", card: second },
    ]);
    const settled = vi.fn();
    void mutation.then(settled, settled);
    await Promise.resolve();

    expect(settled).not.toHaveBeenCalled();
    finishEdit();
    await expect(mutation).rejects.toThrow("create failed");
  });

  it("rejects edit and delete when the Card cannot be resolved", async () => {
    const card = createCardFixture({ id: "missing" });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Card "missing" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Card "missing" was not found');

    expect(mocks.editRemoteCard).not.toHaveBeenCalled();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });

  it("rejects edit and delete when the Card parent Deck cannot be resolved", async () => {
    const card = createCardFixture({ id: "orphan", deckId: "missing-deck" });
    cardStore.setState({ remoteCards: [card] });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Deck "missing-deck" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Deck "missing-deck" was not found');

    expect(mocks.editRemoteCard).not.toHaveBeenCalled();
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });
});
