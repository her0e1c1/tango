import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  createRemoteDeck: vi.fn(),
  deleteRemoteDeck: vi.fn(),
  editRemoteDeck: vi.fn(),
  abandonStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/study-session/@x/deck", () => ({ abandonStudySession: mocks.abandonStudySession }));
vi.mock("./firestore", () => ({
  createDeck: mocks.createRemoteDeck,
  deleteDeck: mocks.deleteRemoteDeck,
  editDeck: mocks.editRemoteDeck,
}));

import { deleteDeck, editDeck } from "./mutations";
import { deckStore } from "../model/store";

describe("Deck mutations [DECK-02] [DECK-03]", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [] });
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
    expect(mocks.deleteRemoteDeck).not.toHaveBeenCalled();
  });

  it("rejects remote edits before writing when the authenticated user does not own the Deck", async () => {
    const deck = createDeckFixture({ id: "remote", uid: "owner" });
    deckStore.setState({ remoteDecks: [deck] });

    await expect(editDeck("other-user", { id: deck.id, name: "Renamed" })).rejects.toThrow("owner does not match");
    expect(mocks.editRemoteDeck).not.toHaveBeenCalled();
  });

  it("routes matching-owner edits and deletes to remote persistence", async () => {
    const deck = createDeckFixture({ id: "remote", uid: "owner" });
    deckStore.setState({ remoteDecks: [deck] });

    await editDeck("owner", { id: deck.id, name: "Renamed" });
    await deleteDeck("owner", deck.id);

    expect(mocks.editRemoteDeck).toHaveBeenCalledExactlyOnceWith("owner", {
      id: deck.id,
      name: "Renamed",
    });
    expect(mocks.deleteRemoteDeck).toHaveBeenCalledExactlyOnceWith("owner", deck.id);
  });
});
