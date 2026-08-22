import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture, createLocalCard, createLocalDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  createRemoteDeck: vi.fn(),
  createRemoteDeckWithCards: vi.fn(),
  deleteLocalCardsByDeckId: vi.fn(),
  deleteRemoteDeck: vi.fn(),
  editRemoteDeck: vi.fn(),
  getLocalCardsByDeckId: vi.fn(),
  removeStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/card/@x/deck", () => ({
  deleteLocalCardsByDeckId: mocks.deleteLocalCardsByDeckId,
  getLocalCardsByDeckId: mocks.getLocalCardsByDeckId,
}));
vi.mock("@/entities/study-session/@x/deck", () => ({ removeStudySession: mocks.removeStudySession }));
vi.mock("./firestore", () => ({
  createDeck: mocks.createRemoteDeck,
  createDeckWithCards: mocks.createRemoteDeckWithCards,
  deleteDeck: mocks.deleteRemoteDeck,
  editDeck: mocks.editRemoteDeck,
}));

import { deleteDeck, editDeck } from "./mutations";
import { deckStore } from "../model/store";

describe("Deck mutations", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    localStorage.clear();
    vi.clearAllMocks();
    mocks.getLocalCardsByDeckId.mockReturnValue([]);
  });

  it("rejects edit and delete when the Deck cannot be resolved", async () => {
    const deck = createDeckFixture({ id: "missing" });

    await expect(editDeck("uid", { id: deck.id, name: "Renamed" })).rejects.toThrow('Deck "missing" was not found');
    await expect(deleteDeck("uid", deck.id)).rejects.toThrow('Deck "missing" was not found');
  });

  it("rejects remote deletion when the authenticated user does not own the Deck", async () => {
    const deck = createDeckFixture({ id: "remote", uid: "owner" });
    deckStore.setState({ remoteDecks: [deck] });

    await expect(deleteDeck("other-user", deck.id)).rejects.toThrow("owner does not match");
  });

  it("moves a local Deck and its Cards to remote persistence when local mode is disabled", async () => {
    const deck = createLocalDeck({ id: "local", name: "Local Deck", url: "https://example.com/local.csv" });
    const cards = [createLocalCard({ id: "card", deckId: deck.id })];
    deckStore.setState({ localDecks: [deck] });
    mocks.getLocalCardsByDeckId.mockReturnValue(cards);

    await editDeck("uid", { id: deck.id, name: "Synced Deck", url: null, localMode: false });

    expect(mocks.createRemoteDeckWithCards).toHaveBeenCalledExactlyOnceWith(
      "uid",
      expect.objectContaining({ id: deck.id, uid: "uid", name: "Synced Deck", localMode: false }),
      [expect.objectContaining({ id: cards[0]?.id, deckId: deck.id, uid: "uid" })]
    );
    const remoteInput = mocks.createRemoteDeckWithCards.mock.calls[0]?.[1];
    expect(remoteInput).not.toHaveProperty("createdAt");
    expect(remoteInput).not.toHaveProperty("updatedAt");
    expect(remoteInput).not.toHaveProperty("url");
    expect(mocks.createRemoteDeckWithCards.mock.calls[0]?.[2]?.[0]).not.toHaveProperty("createdAt");
    expect(mocks.createRemoteDeckWithCards.mock.calls[0]?.[2]?.[0]).not.toHaveProperty("updatedAt");
    expect(mocks.deleteLocalCardsByDeckId).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(deckStore.getState().localDecks).toEqual([]);
  });

  it("keeps the local Deck without deleting remote data when the atomic migration fails", async () => {
    const deck = createLocalDeck({ id: "local" });
    deckStore.setState({ localDecks: [deck] });
    mocks.createRemoteDeckWithCards.mockRejectedValueOnce(new Error("batch failed"));

    await expect(editDeck("uid", { id: deck.id, localMode: false })).rejects.toThrow("batch failed");

    expect(mocks.deleteRemoteDeck).not.toHaveBeenCalled();
    expect(mocks.deleteLocalCardsByDeckId).not.toHaveBeenCalled();
    expect(deckStore.getState().localDecks).toEqual([deck]);
  });

  it("does not let a failed overlapping migration undo a successful one", async () => {
    const deck = createLocalDeck({ id: "local" });
    deckStore.setState({ localDecks: [deck] });
    const remoteDeckIds = new Set<string>();
    let finishSuccessfulMigration = () => undefined;
    mocks.createRemoteDeckWithCards
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishSuccessfulMigration = () => {
              remoteDeckIds.add(deck.id);
              resolve();
            };
          })
      )
      .mockRejectedValueOnce(new Error("overlapping batch failed"));

    const successfulMigration = editDeck("uid", { id: deck.id, localMode: false });
    const failedMigration = editDeck("uid", { id: deck.id, localMode: false });

    await expect(failedMigration).rejects.toThrow("overlapping batch failed");
    finishSuccessfulMigration();
    await successfulMigration;

    expect(remoteDeckIds).toEqual(new Set([deck.id]));
    expect(mocks.deleteRemoteDeck).not.toHaveBeenCalled();
    expect(deckStore.getState().localDecks).toEqual([]);
  });

  it("keeps local data when Cards change during the remote commit", async () => {
    const deck = createLocalDeck({ id: "local" });
    const originalCard = createLocalCard({ id: "card", deckId: deck.id, frontText: "before" });
    const changedCard = createLocalCard({ id: originalCard.id, deckId: deck.id, frontText: "after" });
    deckStore.setState({ localDecks: [deck] });
    mocks.getLocalCardsByDeckId.mockReturnValueOnce([originalCard]).mockReturnValueOnce([changedCard]);

    await expect(editDeck("uid", { id: deck.id, localMode: false })).rejects.toThrow("changed while moving");

    expect(mocks.deleteLocalCardsByDeckId).not.toHaveBeenCalled();
    expect(deckStore.getState().localDecks).toEqual([deck]);
  });

  it("rejects moving a remote Deck into local storage", async () => {
    const deck = createDeckFixture({ id: "remote", uid: "uid" });
    deckStore.setState({ remoteDecks: [deck] });

    await expect(editDeck("uid", { id: deck.id, localMode: true })).rejects.toThrow("cannot be moved to local storage");
    expect(mocks.editRemoteDeck).not.toHaveBeenCalled();
  });
});
