import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeck, deleteDeck, editDeck } from "./mutations";
import { deckStore, findDeckById } from "../model/store";

const mocks = vi.hoisted(() => ({
  createRemoteDeck: vi.fn(),
  deleteRemoteDeck: vi.fn(),
  editRemoteDeck: vi.fn(),
  deleteLocalCardsByDeckId: vi.fn(),
}));

vi.mock("./firestore", () => ({
  createDeck: mocks.createRemoteDeck,
  deleteDeck: mocks.deleteRemoteDeck,
  editDeck: mocks.editRemoteDeck,
}));

vi.mock("@/entities/card/@x/deck", () => ({
  deleteLocalCardsByDeckId: mocks.deleteLocalCardsByDeckId,
}));

describe("Deck mutations", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.clearAllMocks();
  });

  it("routes local Deck create, edit, and delete to local persistence", async () => {
    const deck = createDeckFixture({ id: "local", localMode: true });

    await createDeck("", deck);
    await editDeck("", { id: deck.id, name: "Renamed" });

    expect(findDeckById(deck.id)).toMatchObject({ id: deck.id, name: "Renamed", localMode: true });
    expect(mocks.createRemoteDeck).not.toHaveBeenCalled();
    expect(mocks.editRemoteDeck).not.toHaveBeenCalled();

    await deleteDeck("", deck);

    expect(findDeckById(deck.id)).toBeUndefined();
    expect(mocks.deleteLocalCardsByDeckId).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(mocks.deleteRemoteDeck).not.toHaveBeenCalled();
  });

  it("preserves remote Deck mutation behavior", async () => {
    const deck = createDeckFixture({ id: "remote", localMode: false });
    const edit = { id: deck.id, name: "Renamed" };

    await createDeck("uid", deck);
    await editDeck("uid", edit);
    await deleteDeck("uid", deck);

    expect(mocks.createRemoteDeck).toHaveBeenCalledExactlyOnceWith("uid", deck);
    expect(mocks.editRemoteDeck).toHaveBeenCalledExactlyOnceWith("uid", edit);
    expect(mocks.deleteRemoteDeck).toHaveBeenCalledExactlyOnceWith("uid", deck);
    expect(mocks.deleteLocalCardsByDeckId).not.toHaveBeenCalled();
  });
});
