import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCard as createCardFixture,
  createDeck as createDeckFixture,
  createLocalCard,
  createLocalDeck,
} from "@/test/factories";

import {
  type CardBulkMutationError,
  type CardMutation,
  deleteCard,
  deleteLocalCardsByDeckId,
  editCard,
  mutateCards,
} from "./mutations";
import { cardStore, findCardById } from "../model/store";

const mocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  deleteRemoteCard: vi.fn(),
  editRemoteCard: vi.fn(),
  findDeckById: vi.fn(),
  createLocalStudyProgress: vi.fn(),
  deleteLocalStudyProgress: vi.fn(),
  deleteLocalStudyProgresses: vi.fn(),
}));

vi.mock("./firestore", () => ({
  createCard: mocks.createRemoteCard,
  deleteCard: mocks.deleteRemoteCard,
  editCard: mocks.editRemoteCard,
}));

vi.mock("@/entities/deck/@x/card", () => ({
  findDeckById: mocks.findDeckById,
}));
vi.mock("@/entities/study-progress/@x/card", () => ({
  createLocalStudyProgress: mocks.createLocalStudyProgress,
  deleteLocalStudyProgress: mocks.deleteLocalStudyProgress,
  deleteLocalStudyProgresses: mocks.deleteLocalStudyProgresses,
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
    expect(mocks.createLocalStudyProgress).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(mocks.createRemoteCard).not.toHaveBeenCalled();
    expect(mocks.editRemoteCard).not.toHaveBeenCalled();

    await deleteCard("", card);

    expect(findCardById(card.id)).toBeUndefined();
    expect(mocks.deleteLocalStudyProgress).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(mocks.deleteRemoteCard).not.toHaveBeenCalled();
  });

  it("deletes local progress with every Card removed for a Deck", () => {
    const deck = createLocalDeck({ id: "local-deck" });
    cardStore.setState({
      localCards: [
        createLocalCard({ id: "first", deckId: deck.id }),
        createLocalCard({ id: "second", deckId: deck.id }),
      ],
    });

    deleteLocalCardsByDeckId(deck.id);

    expect(mocks.deleteLocalStudyProgresses).toHaveBeenCalledExactlyOnceWith(["first", "second"]);
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

    await expect(mutateCards("uid", [{ kind: "create", card }])).rejects.toMatchObject({
      failedIds: [card.id],
    });

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
