import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(() => "card-collection"),
  deleteDoc: vi.fn(),
  doc: vi.fn(() => "deck-ref"),
  getDocs: vi.fn(),
  query: vi.fn(() => "card-query"),
  where: vi.fn((...parts: unknown[]) => parts),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  getDocs: mocks.getDocs,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
}));

import { deleteDeckDocuments } from "./firestore";

describe("deleteDeckDocuments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the Deck only after every child Card deletion settles", async () => {
    let finishSecond!: () => void;
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }, { ref: "card-b" }] });
    mocks.deleteDoc
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishSecond = resolve)))
      .mockResolvedValueOnce(undefined);

    const operation = deleteDeckDocuments("uid-a", "deck-id");
    await vi.waitFor(() => expect(mocks.deleteDoc).toHaveBeenCalledTimes(2));
    expect(mocks.query).toHaveBeenCalledWith("card-collection", ["uid", "==", "uid-a"], ["deckId", "==", "deck-id"]);
    expect(mocks.doc).not.toHaveBeenCalled();

    finishSecond();
    await operation;
    expect(mocks.deleteDoc).toHaveBeenNthCalledWith(3, "deck-ref");
  });

  it("keeps the Deck when any child Card deletion fails", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }] });
    mocks.deleteDoc.mockRejectedValueOnce(new Error("card deletion failed"));

    await expect(deleteDeckDocuments("uid-a", "deck-id")).rejects.toThrow("card deletion failed");
    expect(mocks.doc).not.toHaveBeenCalled();
  });
});
