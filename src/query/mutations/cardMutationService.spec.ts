/**
 * @file Verifies the "createCardMutationService" contract with automated examples.
 * The examples cover locked writes, listener-owned single-write state, and authoritative recovery
 * after partial bulk failure.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { CardBulkMutationError, createCardMutationService } from "@/query/mutations/cardMutationService";
import { createRemoteStore, type RemoteStore } from "@/store/remoteStore";
import { createCard } from "@/test/factories";

/**
 * Provides the deferred test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
};

describe("createCardMutationService", () => {
  const uid = "uid-a";
  let store: RemoteStore;
  const dependencies = {
    createCard: vi.fn<(card: Card) => Promise<string>>(),
    updateCard: vi.fn<(card: CardEdit) => Promise<void>>(),
    removeCard: vi.fn<(id: CardId) => Promise<void>>(),
    upsertCard: vi.fn<(card: Card) => Promise<string>>(),
    readCards: vi.fn<(uid: string) => Promise<Card[]>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createRemoteStore();
    store.begin(uid);
    dependencies.createCard.mockResolvedValue("created");
    dependencies.updateCard.mockResolvedValue(undefined);
    dependencies.removeCard.mockResolvedValue(undefined);
    dependencies.upsertCard.mockResolvedValue("upserted");
    dependencies.readCards.mockResolvedValue([]);
  });

  it("leaves listener-owned data unchanged for create and remove", async () => {
    const existing = createCard({ id: "existing" });
    const created = createCard({ id: "created" });
    store.replace(uid, "cards", { existing });
    const service = createCardMutationService({ store, ...dependencies });

    await service.create(uid, created);
    expect(store.read(uid, "cards")).toEqual({ existing });
    expect(dependencies.createCard).toHaveBeenCalledWith(created);

    await service.remove(uid, created.id);
    expect(store.read(uid, "cards")).toEqual({ existing });
    expect(dependencies.removeCard).toHaveBeenCalledWith(created.id);
  });

  it("leaves listener-owned data unchanged after a failed update", async () => {
    const card = createCard({ id: "card", score: 1 });
    const other = createCard({ id: "other", score: 5 });
    store.replace(uid, "cards", { card, other });
    dependencies.updateCard.mockRejectedValueOnce(new Error("write failed"));
    const service = createCardMutationService({ store, ...dependencies });

    await expect(service.update(uid, { id: card.id, deckId: card.deckId, score: 2 })).rejects.toThrow("write failed");

    expect(store.read(uid, "cards")).toEqual({ card, other });
  });

  it("does not overwrite a newer listener snapshot after a failed write", async () => {
    const card = createCard({ id: "card", score: 1 });
    const write = deferred<void>();
    dependencies.updateCard.mockReturnValueOnce(write.promise);
    store.replace(uid, "cards", { card });
    const service = createCardMutationService({ store, ...dependencies });

    const update = service.update(uid, { id: card.id, deckId: card.deckId, score: 2 });
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalled());
    const listenerCard = { ...card, score: 3 };
    store.replace(uid, "cards", { card: listenerCard });
    write.reject(new Error("old write failed"));

    await expect(update).rejects.toThrow("old write failed");
    expect(store.read(uid, "cards")).toEqual({ card: listenerCard });
  });

  it("serializes the same Card while allowing different Cards to update concurrently", async () => {
    const cardA = createCard({ id: "a", score: 0 });
    const cardB = createCard({ id: "b", score: 0 });
    store.replace(uid, "cards", { a: cardA, b: cardB });
    const first = deferred<void>();
    dependencies.updateCard.mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const service = createCardMutationService({ store, ...dependencies });

    const updateA1 = service.update(uid, { id: "a", deckId: cardA.deckId, score: 1 });
    const updateA2 = service.update(uid, { id: "a", deckId: cardA.deckId, score: 2 });
    const updateB = service.update(uid, { id: "b", deckId: cardB.deckId, score: 3 });
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledTimes(2));
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(1, {
      id: "a",
      deckId: cardA.deckId,
      score: 1,
    });
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(2, {
      id: "b",
      deckId: cardB.deckId,
      score: 3,
    });

    first.resolve();
    await Promise.all([updateA1, updateA2, updateB]);
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(3, {
      id: "a",
      deckId: cardA.deckId,
      score: 2,
    });
  });

  it("authoritatively refetches after a partial bulk upsert failure", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    dependencies.upsertCard.mockResolvedValueOnce(first.id).mockRejectedValueOnce(new Error("partial"));
    const authoritative = createCard({ id: "authoritative" });
    dependencies.readCards.mockResolvedValue([authoritative]);
    const service = createCardMutationService({ store, ...dependencies });

    const error = await service.bulkUpsert(uid, [first, second]).catch((cause: unknown) => cause);
    expect(error).toEqual(expect.objectContaining({ message: "1 of 2 Card writes failed" }));
    expect((error as CardBulkMutationError).failedIds).toEqual([second.id]);

    expect(dependencies.readCards).toHaveBeenCalledWith(uid);
    expect(store.read(uid, "cards")).toEqual({ authoritative });
  });

  it("does not pre-replace Cards before bulk writes settle", async () => {
    const existing = createCard({ id: "existing" });
    const upsert = createCard({ id: "upsert" });
    const write = deferred<string>();
    dependencies.upsertCard.mockReturnValueOnce(write.promise);
    store.replace(uid, "cards", { existing });
    const service = createCardMutationService({ store, ...dependencies });

    const operation = service.bulkUpsert(uid, [upsert]);

    await vi.waitFor(() => expect(dependencies.upsertCard).toHaveBeenCalled());
    expect(store.read(uid, "cards")).toEqual({ existing });
    write.resolve(upsert.id);
    await operation;
  });

  it("preserves failed Card IDs when authoritative resynchronization also fails", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    const readError = new Error("authoritative read failed");
    dependencies.upsertCard.mockResolvedValueOnce(first.id).mockRejectedValueOnce(new Error("write failed"));
    dependencies.readCards.mockRejectedValueOnce(readError);
    const service = createCardMutationService({ store, ...dependencies });

    const error = await service.bulkUpsert(uid, [first, second]).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(CardBulkMutationError);
    expect((error as CardBulkMutationError).failedIds).toEqual([second.id]);
    expect((error as Error).cause).toBe(readError);
  });
});
