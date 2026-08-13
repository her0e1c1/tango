import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(() => "card-collection"),
  getDocs: vi.fn(),
  query: vi.fn(() => "card-query"),
  removeDeckDocument: vi.fn(),
  where: vi.fn((...parts: unknown[]) => parts),
  writeBatch: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  getDocs: mocks.getDocs,
  query: mocks.query,
  where: mocks.where,
  writeBatch: mocks.writeBatch,
}));
vi.mock("@/entities/deck", () => ({ removeDeckDocument: mocks.removeDeckDocument }));
vi.mock("@/shared/firestore", () => ({ getDb: () => "db" }));

import { CARD_DELETE_BATCH_SIZE, removeDeckWithCards } from "./removeDeck";

const documents = (count: number, start = 0) =>
  Array.from({ length: count }, (_, index) => ({ ref: `card-${start + index}` }));

const batch = () => ({ delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) });

describe("removeDeckWithCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDocs.mockResolvedValue({ docs: [] });
    mocks.removeDeckDocument.mockResolvedValue(undefined);
  });

  it("deletes an empty Deck without creating a Card batch", async () => {
    await removeDeckWithCards("deck-id", "uid-a");

    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenNthCalledWith(1, "uid", "==", "uid-a");
    expect(mocks.where).toHaveBeenNthCalledWith(2, "deckId", "==", "deck-id");
    expect(mocks.getDocs).toHaveBeenCalledWith("card-query");
    expect(mocks.writeBatch).not.toHaveBeenCalled();
    expect(mocks.removeDeckDocument).toHaveBeenCalledExactlyOnceWith("deck-id", "db");
  });

  it("deletes one bounded Card batch before the Deck", async () => {
    const cardBatch = batch();
    mocks.getDocs.mockResolvedValue({ docs: documents(CARD_DELETE_BATCH_SIZE) });
    mocks.writeBatch.mockReturnValue(cardBatch);

    await removeDeckWithCards("deck-id", "uid-a");

    expect(cardBatch.delete).toHaveBeenCalledTimes(CARD_DELETE_BATCH_SIZE);
    expect(cardBatch.commit).toHaveBeenCalledOnce();
    expect(cardBatch.commit.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.removeDeckDocument.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    );
  });

  it("commits multiple bounded Card batches serially", async () => {
    const first = batch();
    const second = batch();
    let finishFirst!: () => void;
    first.commit.mockReturnValueOnce(new Promise<void>((resolve) => (finishFirst = resolve)));
    mocks.getDocs.mockResolvedValue({ docs: documents(CARD_DELETE_BATCH_SIZE + 1) });
    mocks.writeBatch.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const operation = removeDeckWithCards("deck-id", "uid-a");
    await vi.waitFor(() => expect(first.commit).toHaveBeenCalledOnce());
    expect(mocks.writeBatch).toHaveBeenCalledOnce();
    expect(second.commit).not.toHaveBeenCalled();
    expect(mocks.removeDeckDocument).not.toHaveBeenCalled();

    finishFirst();
    await operation;

    expect(first.delete).toHaveBeenCalledTimes(CARD_DELETE_BATCH_SIZE);
    expect(second.delete).toHaveBeenCalledExactlyOnceWith(`card-${CARD_DELETE_BATCH_SIZE}`);
    expect(second.commit).toHaveBeenCalledOnce();
    expect(mocks.removeDeckDocument).toHaveBeenCalledExactlyOnceWith("deck-id", "db");
  });

  it("keeps the Deck after a batch failure and retries only remaining Cards", async () => {
    const failure = new Error("batch failed");
    const first = batch();
    const failed = batch();
    failed.commit.mockRejectedValueOnce(failure);
    mocks.getDocs
      .mockResolvedValueOnce({ docs: documents(CARD_DELETE_BATCH_SIZE + 1) })
      .mockResolvedValueOnce({ docs: documents(1, CARD_DELETE_BATCH_SIZE) });
    mocks.writeBatch.mockReturnValueOnce(first).mockReturnValueOnce(failed);

    await expect(removeDeckWithCards("deck-id", "uid-a")).rejects.toBe(failure);
    expect(first.commit).toHaveBeenCalledOnce();
    expect(failed.commit).toHaveBeenCalledOnce();
    expect(mocks.removeDeckDocument).not.toHaveBeenCalled();

    const retry = batch();
    mocks.writeBatch.mockReturnValueOnce(retry);
    await removeDeckWithCards("deck-id", "uid-a");

    expect(mocks.getDocs).toHaveBeenCalledTimes(2);
    expect(retry.delete).toHaveBeenCalledExactlyOnceWith(`card-${CARD_DELETE_BATCH_SIZE}`);
    expect(mocks.removeDeckDocument).toHaveBeenCalledExactlyOnceWith("deck-id", "db");
  });
});
