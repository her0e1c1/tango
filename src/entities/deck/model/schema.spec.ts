import { describe, expect, expectTypeOf, it } from "vitest";

import type { RemoteDeckCreateInput } from "./types";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeckSchema, editDeckSchema } from "./schema";

describe("Deck operation schemas [DECK-MANAGEMENT-01 DECK-MANAGEMENT-05]", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  describe("createDeckSchema", () => {
    it("applies entity defaults without adding persistence timestamps", () => {
      expect(createDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", name: " Deck " } })).toEqual({
        uid: "uid-a",
        deck: {
          id: "deck",
          name: "Deck",

          isPublic: false,
          category: "",
          convertToBr: false,
        },
      });
      expectTypeOf<RemoteDeckCreateInput>().not.toHaveProperty("uid");
    });

    it.each([
      ["authenticated uid", { uid: "", deck }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { ...deck, id: "" } }, "Deck id"],
      ["Deck name", { uid: "uid-a", deck: { ...deck, name: "   " } }, "Deck name"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => createDeckSchema.parse(input)).toThrow(message);
    });

    it("drops caller-provided owner metadata from the command", () => {
      const parsed = createDeckSchema.parse({ uid: "actor", deck: { ...deck, uid: "other-user" } });

      expect(parsed.deck).not.toHaveProperty("uid");
    });
  });

  describe("editDeckSchema", () => {
    it("accepts a partial edit with a non-empty Deck id", () => {
      expect(editDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", name: " Renamed " } })).toEqual({
        uid: "uid-a",
        deck: { id: "deck", name: "Renamed" },
      });
    });

    it.each([
      ["authenticated uid", { uid: "", deck: { id: "deck" } }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { id: "" } }, "Deck id"],
      ["provided Deck name", { uid: "uid-a", deck: { id: "deck", name: "   " } }, "Deck name"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => editDeckSchema.parse(input)).toThrow(message);
    });
  });
});
