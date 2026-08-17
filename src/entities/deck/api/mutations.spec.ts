import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { deleteDeck, editDeck } from "./mutations";
import { deckStore } from "../model/store";

describe("Deck mutations", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    localStorage.clear();
  });

  it("rejects edit and delete when the Deck cannot be resolved", async () => {
    await expect(editDeck("uid", { id: "missing", name: "Renamed" })).rejects.toThrow('Deck "missing" was not found');
    await expect(deleteDeck("uid", "missing")).rejects.toThrow('Deck "missing" was not found');
  });
});
