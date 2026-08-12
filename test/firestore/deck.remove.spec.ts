/** @file Verifies that Deck removal settles every child deletion before completing. */

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

import { remove } from "@/entities/deck/api/firestore";

describe("firestore/deck.remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the Deck only after every matching child Card deletion settles", async () => {
    let finishSecond!: () => void;
    const secondDeletion = new Promise<void>((resolve) => {
      finishSecond = resolve;
    });
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }, { ref: "card-b" }] });
    mocks.deleteDoc.mockResolvedValueOnce(undefined).mockReturnValueOnce(secondDeletion).mockResolvedValueOnce(undefined);

    const operation = remove("deck-id", "uid-a");
    await vi.waitFor(() => expect(mocks.deleteDoc).toHaveBeenCalledTimes(2));

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenNthCalledWith(1, "uid", "==", "uid-a");
    expect(mocks.where).toHaveBeenNthCalledWith(2, "deckId", "==", "deck-id");
    expect(mocks.query).toHaveBeenCalledWith(
      "card-collection",
      ["uid", "==", "uid-a"],
      ["deckId", "==", "deck-id"]
    );
    expect(mocks.getDocs).toHaveBeenCalledWith("card-query");
    expect(mocks.doc).not.toHaveBeenCalled();

    finishSecond();
    await operation;

    expect(mocks.doc).toHaveBeenCalledWith("db", "deck", "deck-id");
    expect(mocks.deleteDoc).toHaveBeenNthCalledWith(3, "deck-ref");
  });

  it("waits for every child deletion and preserves the first useful error", async () => {
    const error = new Error("first child failed");
    let finishSecond!: () => void;
    const secondDeletion = new Promise<void>((resolve) => {
      finishSecond = resolve;
    });
    mocks.getDocs.mockResolvedValue({ docs: [{ ref: "card-a" }, { ref: "card-b" }] });
    mocks.deleteDoc.mockRejectedValueOnce(error).mockReturnValueOnce(secondDeletion);

    const operation = remove("deck-id", "uid-a");
    const observed = operation.then(
      () => undefined,
      (cause: unknown) => cause
    );
    await vi.waitFor(() => expect(mocks.deleteDoc).toHaveBeenCalledTimes(2));
    let settled = false;
    void operation.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(mocks.doc).not.toHaveBeenCalled();

    finishSecond();
    expect(await observed).toBe(error);
    expect(settled).toBe(true);
    expect(mocks.doc).not.toHaveBeenCalled();
  });
});
