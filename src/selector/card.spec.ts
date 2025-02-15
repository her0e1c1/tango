import { expect, it, describe } from "vitest";
import { splitByUniqueKey } from "./card";

describe("card selector", () => {
  describe("splitByUniqueKey", () => {
    const state = {
      card: {
        byId: {
          1: { uniqueKey: "a" } as Card,
          2: { uniqueKey: "b" } as Card,
          3: { uniqueKey: "c" } as Card,
        },
        tags: [],
      } as CardState,
    } as RootState;

    it("should split into new cards", async () => {
      const cards = [{ uniqueKey: "A" }, { uniqueKey: "B" }, { uniqueKey: "C" }] as Card[];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual(cards);
      expect(oldCards).toEqual([]);
    });

    it("should split into old cards", async () => {
      const cards = [{ uniqueKey: "a" }, { uniqueKey: "b" }, { uniqueKey: "c" }] as Card[];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual([]);
      expect(oldCards).toEqual(cards);
    });

    it("should split into new and old cards", async () => {
      const cards = [{ uniqueKey: "A" }, { uniqueKey: "b" }, { uniqueKey: "c" }] as Card[];
      const [newCards, oldCards] = splitByUniqueKey(cards)(state);
      expect(newCards).toEqual(cards.slice(0, 1));
      expect(oldCards).toEqual(cards.slice(1, 3));
    });
  });
});
