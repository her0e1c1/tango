import { describe, expect, expectTypeOf, it } from "vitest";

import type { RemoteDeckCreateInput } from "./types";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeckSchema, editDeckSchema } from "./schema";

describe("Deck operation schemas [CARD-LIST-ACTIONS-01]", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  describe("createDeckSchema", () => {
    it("applies entity defaults without adding persistence timestamps", () => {
      expect(createDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", name: " Deck " } })).toEqual({
        uid: "uid-a",
        deck: {
          id: "deck",
          name: "Deck",

          isPublic: false,
          selectedTags: [],
          tagAndFilter: false,
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
      ["Deck URL", { uid: "uid-a", deck: { ...deck, url: "not-a-url" } }, "valid URL"],
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
      expect(
        editDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", name: " Renamed ", url: "https://example.com" } })
      ).toEqual({
        uid: "uid-a",
        deck: { id: "deck", name: "Renamed", url: "https://example.com" },
      });
    });

    it("uses null to distinguish clearing a URL from leaving it unchanged", () => {
      expect(editDeckSchema.parse({ uid: "uid-a", deck: { id: "deck" } }).deck).not.toHaveProperty("url");
      expect(editDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", url: null } }).deck).toHaveProperty("url", null);
    });

    it.each([
      ["authenticated uid", { uid: "", deck: { id: "deck" } }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { id: "" } }, "Deck id"],
      ["provided Deck name", { uid: "uid-a", deck: { id: "deck", name: "   " } }, "Deck name"],
      ["provided Deck URL", { uid: "uid-a", deck: { id: "deck", url: "not-a-url" } }, "valid URL"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => editDeckSchema.parse(input)).toThrow(message);
    });
  });
});
