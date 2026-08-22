import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { deleteDeck, editDeck } from "./mutations";
import { deckStore } from "../model/store";

describe("Deck mutations", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    localStorage.clear();
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
});
