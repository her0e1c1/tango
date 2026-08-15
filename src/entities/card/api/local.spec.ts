import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateCardId } from "../model/id";
import { cardStore } from "../model/store";
import { createLocalCard, deleteLocalCard, deleteLocalCardsByDeckId, editLocalCard } from "./local";

const cardInput = (id: string, deckId = "deck") => ({
  id,
  deckId,
  uid: "uid",
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: `key-${id}`,
});

describe("local Card persistence", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    vi.useRealTimers();
  });

  it("creates, edits, and deletes a local Card", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(10).mockReturnValueOnce(20);
    const createdCard = createLocalCard(cardInput("local"));

    expect(createdCard).toEqual(expect.objectContaining({ id: "local", createdAt: 10, updatedAt: 10 }));

    const updatedCard = editLocalCard({ id: "local", uid: "uid", frontText: "updated" });
    expect(updatedCard).toEqual(expect.objectContaining({ frontText: "updated", createdAt: 10, updatedAt: 20 }));

    deleteLocalCard("local");
    expect(cardStore.getState().localCards).toEqual([]);
  });

  it("deletes local Cards by Deck", () => {
    createLocalCard(cardInput("first", "deck-a"));
    createLocalCard(cardInput("second", "deck-b"));

    deleteLocalCardsByDeckId("deck-a");

    expect(cardStore.getState().localCards.map(({ id }) => id)).toEqual(["second"]);
  });

  it("generates an ID without Firebase", () => {
    expect(generateCardId()).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});
