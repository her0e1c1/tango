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
vi.mock("@/adapters/firestore/runtime", () => ({ getDb: () => "db" }));

import { remove } from "@/adapters/firestore/deck";

describe("firestore/deck.remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
