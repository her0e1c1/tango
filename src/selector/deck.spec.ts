import { expect, it, describe } from "vitest";
import { findByName } from "@src/selector/deck";
import { createDeck, createRootState } from "@src/test/factories";

describe("deck selector", () => {
  describe("findByName", () => {
    const deck = createDeck({ id: "id", name: "deckName" });
    const state = createRootState({ deck: { byId: { [deck.id]: deck }, categories: [] } });
    it("sholud find by name", () => {
      expect(findByName("deckName")(state)).toEqual("id");
    });
    it("sholud not find by name", () => {
      expect(findByName("invalid")(state)).toBeNull();
    });
  });
});
