import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateDeckId } from "../model/id";
import { deckStore } from "../model/store";
import { createLocalDeck, deleteLocalDeck, editLocalDeck } from "./local";

describe("local Deck persistence", () => {
  beforeEach(() => {
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.useRealTimers();
  });

  it("creates, edits, and deletes a local Deck", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(10).mockReturnValueOnce(20);
    const createdDeck = createLocalDeck({ id: "local", uid: "uid", name: "Local", localMode: true });

    expect(createdDeck).toEqual(
      expect.objectContaining({ id: "local", localMode: true, createdAt: 10, updatedAt: 10 })
    );

    const updatedDeck = editLocalDeck({ id: "local", name: "Renamed" });
    expect(updatedDeck).toEqual(expect.objectContaining({ name: "Renamed", createdAt: 10, updatedAt: 20 }));

    deleteLocalDeck("local");
    expect(deckStore.getState().localDecks).toEqual([]);
  });

  it("generates an ID without Firebase", () => {
    expect(generateDeckId()).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});
