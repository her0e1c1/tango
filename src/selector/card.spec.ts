import { expect, it, describe } from "vitest";
import { splitByUniqueKey } from "@src/selector/card";
import { createCard, createRootState } from "@src/test/factories";

describe("card selector", () => {
  describe("splitByUniqueKey", () => {
    const storedCards = [
      createCard({ id: "1", deckId: "deck-a", uniqueKey: "a" }),
      createCard({ id: "2", deckId: "deck-b", uniqueKey: "b" }),
      createCard({ id: "3", deckId: "deck-c", uniqueKey: "c" }),
    ];
    const state = createRootState({
      card: { byId: Object.fromEntries(storedCards.map((card) => [card.id, card])), tags: [] },
    });

    const rawCard = (uniqueKey: string): CardRaw => ({ frontText: "front", backText: "back", tags: [], uniqueKey });

    it("should split into new cards", async () => {
      const cards = [rawCard("A"), rawCard("B"), rawCard("C")];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual(cards);
      expect(oldCards).toEqual([]);
    });

    it("should split into old cards", async () => {
      const cards = [rawCard("a"), rawCard("b"), rawCard("c")];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual([]);
      expect(oldCards).toEqual([
        { ...cards[0], id: "1", deckId: "deck-a" },
        { ...cards[1], id: "2", deckId: "deck-b" },
        { ...cards[2], id: "3", deckId: "deck-c" },
      ]);
    });

    it("should split into new and old cards", async () => {
      const cards = [rawCard("A"), rawCard("b"), rawCard("c")];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual(cards.slice(0, 1));
      expect(oldCards).toEqual([
        { ...cards[1], id: "2", deckId: "deck-b" },
        { ...cards[2], id: "3", deckId: "deck-c" },
      ]);
    });
  });
});
