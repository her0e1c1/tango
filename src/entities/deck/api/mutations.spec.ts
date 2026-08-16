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
    await expect(deleteDeck("uid", deck)).rejects.toThrow('Deck "missing" was not found');
  });
});
