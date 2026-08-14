import { describe, expect, it } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

import { createDeck, createDeckSchema, deleteDeckSchema, editDeckSchema } from "./schema";

describe("createDeck", () => {
  it("creates a deck with entity defaults and an injected id", () => {
    expect(createDeck({ name: "name" }, "uid", () => "deck-id")).toEqual({
      name: "name",
      id: "deck-id",
      uid: "uid",
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
      scoreMax: null,
      scoreMin: null,
      isPublic: false,
      selectedTags: [],
      tagAndFilter: false,
      convertToBr: false,
      category: "",
    });
  });
});

describe("Deck operation schemas", () => {
  const deck = createDeckFixture({ id: "deck", uid: "uid-a" });

  describe("createDeckSchema", () => {
    it("accepts a complete Deck owned by the authenticated user", () => {
      expect(createDeckSchema.parse({ uid: "uid-a", deck })).toEqual({ uid: "uid-a", deck });
    });

    it.each([
      ["authenticated uid", { uid: "", deck }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { ...deck, id: "" } }, "Deck id"],
      ["Deck uid", { uid: "uid-a", deck: { ...deck, uid: "" } }, "Deck owner"],
      ["Deck name", { uid: "uid-a", deck: { ...deck, name: "" } }, "Deck name"],
      ["owner relationship", { uid: "uid-b", deck }, "owner does not match"],
    ])("rejects an invalid %s", (_case, input, message) => {
      expect(() => createDeckSchema.parse(input)).toThrow(message);
    });
  });

  describe("editDeckSchema", () => {
    it("accepts a partial edit with a non-empty Deck id", () => {
      expect(editDeckSchema.parse({ uid: "uid-a", deck: { id: "deck", name: "Renamed" } })).toEqual({
        uid: "uid-a",
        deck: { id: "deck", name: "Renamed" },
      });
    });

    it.each([
      ["authenticated uid", { uid: "", deck: { id: "deck" } }, "confirmed user"],
      ["Deck id", { uid: "uid-a", deck: { id: "" } }, "Deck id"],
      ["provided Deck name", { uid: "uid-a", deck: { id: "deck", name: "" } }, "Deck name"],
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
