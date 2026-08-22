import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture, createLocalDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  createRemoteDeck: vi.fn(),
  deleteLocalCardsByDeckId: vi.fn(),
  deleteRemoteDeck: vi.fn(),
  editRemoteDeck: vi.fn(),
  moveLocalCardsToRemote: vi.fn(),
  removeStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/card/@x/deck", () => ({
  deleteLocalCardsByDeckId: mocks.deleteLocalCardsByDeckId,
  moveLocalCardsToRemote: mocks.moveLocalCardsToRemote,
}));
vi.mock("@/entities/study-session/@x/deck", () => ({ removeStudySession: mocks.removeStudySession }));
vi.mock("./firestore", () => ({
  createDeck: mocks.createRemoteDeck,
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
    deckStore.setState({ localDecks: [deck] });

    await editDeck("uid", { id: deck.id, name: "Synced Deck", url: null, localMode: false });

    expect(mocks.createRemoteDeck).toHaveBeenCalledExactlyOnceWith(
      "uid",
      expect.objectContaining({ id: deck.id, uid: "uid", name: "Synced Deck", localMode: false })
    );
    const remoteInput = mocks.createRemoteDeck.mock.calls[0]?.[1];
    expect(remoteInput).not.toHaveProperty("createdAt");
    expect(remoteInput).not.toHaveProperty("updatedAt");
    expect(remoteInput).not.toHaveProperty("url");
    expect(mocks.moveLocalCardsToRemote).toHaveBeenCalledExactlyOnceWith("uid", deck.id);
    expect(mocks.createRemoteDeck.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.moveLocalCardsToRemote.mock.invocationCallOrder[0] ?? 0
    );
    expect(deckStore.getState().localDecks).toEqual([]);
  });

  it("rejects moving a remote Deck into local storage", async () => {
    const deck = createDeckFixture({ id: "remote", uid: "uid" });
    deckStore.setState({ remoteDecks: [deck] });

    await expect(editDeck("uid", { id: deck.id, localMode: true })).rejects.toThrow("cannot be moved to local storage");
    expect(mocks.editRemoteDeck).not.toHaveBeenCalled();
  });
});
