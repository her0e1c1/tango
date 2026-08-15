import { describe, expect, it } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeckSchema, deleteDeckSchema, editDeckSchema } from "./schema";

describe("Deck operation schemas", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  describe("createDeckSchema", () => {
    it("applies entity defaults without adding persistence timestamps", () => {
      expect(createDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", uid: "uid-a", name: " Deck " } })).toEqual({
        uid: "uid-a",
        deck: {
          id: "deck",
          uid: "uid-a",
          name: "Deck",
          localMode: false,
          isPublic: false,
          scoreMax: null,
          scoreMin: null,
          selectedTags: [],
          tagAndFilter: false,
          category: "",
          convertToBr: false,
          deletedAt: null,
        },
      });
    });

    it.each([
      ["authenticated uid", { uid: "", deck }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { ...deck, id: "" } }, "Deck id"],
      ["Deck uid", { uid: "uid-a", deck: { ...deck, uid: "" } }, "Deck owner"],
      ["Deck name", { uid: "uid-a", deck: { ...deck, name: "   " } }, "Deck name"],
      ["Deck URL", { uid: "uid-a", deck: { ...deck, url: "not-a-url" } }, "valid URL"],
      ["local mode", { uid: "uid-a", deck: { ...deck, localMode: true } }, "Invalid input"],
      ["owner relationship", { uid: "uid-b", deck }, "owner does not match"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => createDeckSchema.parse(input)).toThrow(message);
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

  describe("deleteDeckSchema", () => {
    it("accepts a Deck identity owned by the authenticated user", () => {
      expect(deleteDeckSchema.parse({ uid: "uid-a", deck })).toEqual({
        uid: "uid-a",
        deck: { id: "deck", uid: "uid-a" },
      });
    });

    it.each([
      ["authenticated uid", { uid: "", deck }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { ...deck, id: "" } }, "Deck id"],
      ["Deck uid", { uid: "uid-a", deck: { ...deck, uid: "" } }, "Deck owner"],
      ["owner relationship", { uid: "uid-b", deck }, "owner does not match"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => deleteDeckSchema.parse(input)).toThrow(message);
    });
  });
});
