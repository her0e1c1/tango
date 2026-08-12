import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  doc: vi.fn((...parts: unknown[]) => ({ id: "generated-deck-id", parts })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((...parts: unknown[]) => parts),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn((...parts: unknown[]) => parts),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  query: mocks.query,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
}));
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
  getTimestamp: () => 100,
}));

import { create, exists, generateDeckId, readAll, update } from "./firestore";

const deckDocument = (overrides: Record<string, unknown> = {}) => ({
  name: "Remote Deck",
  isPublic: false,
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  selectedTags: [],
  tagAndFilter: false,
  category: "",
  convertToBr: false,
  ...overrides,
});

describe("Deck Firestore persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDocs.mockResolvedValue({ docs: [] });
    mocks.getDoc.mockResolvedValue({ exists: () => true });
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.updateDoc.mockResolvedValue(undefined);
  });

  it("generates a Deck id from the Deck collection", () => {
    expect(generateDeckId()).toBe("generated-deck-id");
    expect(mocks.collection).toHaveBeenCalledWith("db", "deck");
    expect(mocks.doc).toHaveBeenCalledWith(["db", "deck"]);
  });

  it("reads only active Deck documents through a UID-scoped query", async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [
        { id: "active", data: () => deckDocument() },
        { id: "deleted", data: () => deckDocument({ deletedAt: 3 }) },
      ],
    });

    await expect(readAll("uid-a", "firestore" as never)).resolves.toEqual([
      expect.objectContaining({ id: "active", deletedAt: null }),
    ]);
    expect(mocks.collection).toHaveBeenCalledWith("firestore", "deck");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");
  });

  it("creates and updates only Deck persistence fields", async () => {
    const deck = createDeck({ id: "deck-1", uid: "uid-a", createdAt: 1, updatedAt: 2 });

    await expect(create(deck)).resolves.toBe(deck.id);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ parts: ["db", "deck", deck.id] }),
      expect.objectContaining({ id: deck.id, createdAt: 100, updatedAt: 100 })
    );

    await update({ id: deck.id, name: "Updated" });
    expect(mocks.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ parts: ["db", "deck", deck.id] }), {
      name: "Updated",
      updatedAt: 100,
    });
  });

  it.each([true, false])("returns the snapshot exists value %s", async (expected) => {
    mocks.getDoc.mockResolvedValue({ exists: () => expected });

    await expect(exists("deck-id")).resolves.toBe(expected);
  });

  it("propagates Firestore read errors from exists", async () => {
    const error = Object.assign(new Error("unavailable"), { code: "unavailable" });
    mocks.getDoc.mockRejectedValue(error);

    await expect(exists("deck-id")).rejects.toBe(error);
  });
});
