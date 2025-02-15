import { expect, it, describe } from "vitest";
import { findByName } from "./deck";

describe("deck selector", () => {
  describe("findByName", () => {
    const deck = { name: "deckName" } as unknown as Deck;
    const state = { deck: { byId: { 0: { name: "deckName" } } } } as unknown as RootState;
    it("sholud find by name", () => {
      expect(findByName("deckName")(state)).toEqual(deck);
    });
    it("sholud not find by name", () => {
      expect(findByName("invalid")(state)).toBeNull();
    });
  });
});
