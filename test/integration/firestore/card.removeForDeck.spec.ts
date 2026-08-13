import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(() => "card-collection"),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => "card-query"),
  where: vi.fn((...parts: unknown[]) => parts),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: vi.fn(),
  getDocs: mocks.getDocs,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
}));

import { removeForDeck } from "@/entities/card/api/firestore";

describe("firestore/card.removeForDeck", () => {
  beforeEach(() => vi.clearAllMocks());

  it("waits for every matching Card deletion", async () => {
    let finishSecond!: () => void;
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }, { ref: "card-b" }] });
    mocks.deleteDoc
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishSecond = resolve)));

    const operation = removeForDeck("uid-a", "deck-id");
    await vi.waitFor(() => expect(mocks.deleteDoc).toHaveBeenCalledTimes(2));
    expect(mocks.query).toHaveBeenCalledWith("card-collection", ["uid", "==", "uid-a"], ["deckId", "==", "deck-id"]);

    finishSecond();
    await operation;
  });

  it("waits for every deletion and preserves a failure", async () => {
    const error = new Error("first child failed");
    let finishSecond!: () => void;
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }, { ref: "card-b" }] });
    mocks.deleteDoc
      .mockRejectedValueOnce(error)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishSecond = resolve)));

    const operation = removeForDeck("uid-a", "deck-id");
    await vi.waitFor(() => expect(mocks.deleteDoc).toHaveBeenCalledTimes(2));
    finishSecond();
    await expect(operation).rejects.toBe(error);
  });
});
