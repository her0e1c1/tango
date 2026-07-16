import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCardMutationService } from "@/query/cardMutationService";
import { firestoreKeys } from "@/query/firestoreKeys";
import { createCard } from "@/test/factories";

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
  let client: QueryClient;
  const dependencies = {
    createCard: vi.fn<(card: Card) => Promise<string>>(),
    updateCard: vi.fn<(card: CardEdit) => Promise<void>>(),
    removeCard: vi.fn<(id: CardId) => Promise<void>>(),
    upsertCard: vi.fn<(card: Card) => Promise<string>>(),
    readCards: vi.fn<(uid: string) => Promise<Card[]>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    dependencies.createCard.mockResolvedValue("created");
    dependencies.updateCard.mockResolvedValue(undefined);
    dependencies.removeCard.mockResolvedValue(undefined);
    dependencies.upsertCard.mockResolvedValue("upserted");
    dependencies.readCards.mockResolvedValue([]);
  });

  it("optimistically creates and removes only the target Card", async () => {
    const existing = createCard({ id: "existing" });
    const created = createCard({ id: "created" });
    client.setQueryData(firestoreKeys.cards(uid), { existing });
    const service = createCardMutationService({ client, ...dependencies });

    await service.create(uid, created);
    expect(client.getQueryData(firestoreKeys.cards(uid))).toEqual({ existing, created });
    expect(dependencies.createCard).toHaveBeenCalledWith(created);

    await service.remove(uid, created.id);
    expect(client.getQueryData(firestoreKeys.cards(uid))).toEqual({ existing });
    expect(dependencies.removeCard).toHaveBeenCalledWith(created.id);
  });

  it("rolls back only the failed target Card", async () => {
    const card = createCard({ id: "card", score: 1 });
    const other = createCard({ id: "other", score: 5 });
    client.setQueryData(firestoreKeys.cards(uid), { card, other });
    dependencies.updateCard.mockRejectedValueOnce(new Error("write failed"));
    const service = createCardMutationService({ client, ...dependencies });

    await expect(service.update(uid, { id: card.id, deckId: card.deckId, score: 2 })).rejects.toThrow(
      "write failed"
    );

    expect(client.getQueryData(firestoreKeys.cards(uid))).toEqual({ card, other });
  });

  it("serializes the same Card while allowing different Cards to update concurrently", async () => {
    const cardA = createCard({ id: "a", score: 0 });
    const cardB = createCard({ id: "b", score: 0 });
    client.setQueryData(firestoreKeys.cards(uid), { a: cardA, b: cardB });
    const first = deferred<void>();
    dependencies.updateCard.mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const service = createCardMutationService({ client, ...dependencies });

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
    const service = createCardMutationService({ client, ...dependencies });

    await expect(service.bulkUpsert(uid, [first, second])).rejects.toThrow("1 of 2 Card writes failed");

    expect(dependencies.readCards).toHaveBeenCalledWith(uid);
    expect(client.getQueryData(firestoreKeys.cards(uid))).toEqual({ authoritative });
  });
});
