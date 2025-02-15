import { expect, it, describe } from "vitest";
import { findByName } from "./deck";

describe("deck selector", () => {
  describe("findByName", () => {
    const state = { deck: { byId: { id: { name: "deckName" } } } } as unknown as RootState;
    it("sholud find by name", () => {
      expect(findByName("deckName")(state)).toEqual("id");
    });
    it("sholud not find by name", () => {
      expect(findByName("invalid")(state)).toBeNull();
    });
  });
});
