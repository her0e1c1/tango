import { beforeEach, describe, expect, it, vi } from "vitest";

import { CardBulkMutationError, createCardMutationService } from "@/query/mutations/cardMutationService";
import { createRemoteStore } from "@/store/remoteStore";
import { createCard } from "@/test/factories";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe("createCardMutationService", () => {
  const uid = "uid-a";
  const dependencies = {
    createCard: vi.fn<(card: Card) => Promise<string>>(),
    updateCard: vi.fn<(card: CardEdit) => Promise<void>>(),
    removeCard: vi.fn<(id: CardId) => Promise<void>>(),
    upsertCard: vi.fn<(card: Card) => Promise<string>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.createCard.mockResolvedValue("created");
    dependencies.updateCard.mockResolvedValue(undefined);
    dependencies.removeCard.mockResolvedValue(undefined);
    dependencies.upsertCard.mockResolvedValue("upserted");
  });

  it("uses only adapters and leaves Card data unchanged until applySnapshot", async () => {
    const store = createRemoteStore();
    const existing = createCard({ id: "existing" });
    const created = createCard({ id: "created" });
    store.begin(uid);
    store.applySnapshot(uid, "cards", {
      data: { [existing.id]: existing },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrite = store.getSnapshot();
    const service = createCardMutationService(dependencies);

    await service.create(uid, created);
    await service.update(uid, { id: existing.id, deckId: existing.deckId, score: 1 });
    await service.remove(uid, existing.id);

    expect(store.getSnapshot()).toBe(beforeWrite);
    expect(dependencies.createCard).toHaveBeenCalledWith(created);
    expect(dependencies.updateCard).toHaveBeenCalledWith({ id: existing.id, deckId: existing.deckId, score: 1 });
    expect(dependencies.removeCard).toHaveBeenCalledWith(existing.id);

    store.applySnapshot(uid, "cards", {
      data: { [created.id]: created },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getSnapshot().cardsById).toEqual({ [created.id]: created });
  });

  it("serializes the same Card while allowing different Cards to update concurrently", async () => {
    const cardA = createCard({ id: "a", score: 0 });
    const cardB = createCard({ id: "b", score: 0 });
    const first = deferred<void>();
    dependencies.updateCard.mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const service = createCardMutationService(dependencies);

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

  it("isolates Card locks by UID", async () => {
    const card = createCard({ id: "shared", score: 0 });
    const first = deferred<void>();
    dependencies.updateCard.mockImplementationOnce(() => first.promise).mockResolvedValueOnce(undefined);
    const service = createCardMutationService(dependencies);

    const updateA = service.update("uid-a", { ...card, score: 1 });
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledOnce());
    const updateB = service.update("uid-b", { ...card, score: 2 });
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledTimes(2));

    first.resolve();
    await Promise.all([updateA, updateB]);
  });

  it("reports failed IDs after partial bulk writes without reading or replacing Store data", async () => {
    const store = createRemoteStore();
    const existing = createCard({ id: "existing" });
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    store.begin(uid);
    store.applySnapshot(uid, "cards", {
      data: { [existing.id]: existing },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrite = store.getSnapshot();
    dependencies.upsertCard.mockResolvedValueOnce(first.id).mockRejectedValueOnce(new Error("write failed"));
    const unexpectedRead = vi.fn((_property: PropertyKey) => {
      throw new Error("readCards must not be accessed");
    });
    const adapterOnlyDependencies = new Proxy(dependencies, {
      get: (target, property, receiver) => {
        if (property === "readCards" || property === "store") unexpectedRead(property);
        return Reflect.get(target, property, receiver);
      },
    });
    const service = createCardMutationService(adapterOnlyDependencies);

    const error = await service.bulkUpsert(uid, [first, second]).catch((cause: unknown) => cause);

    expect(dependencies.upsertCard).toHaveBeenCalledTimes(2);
    expect(dependencies.upsertCard).toHaveBeenNthCalledWith(1, first);
    expect(dependencies.upsertCard).toHaveBeenNthCalledWith(2, second);
    expect(error).toBeInstanceOf(CardBulkMutationError);
    expect(error).toEqual(expect.objectContaining({ message: "1 of 2 Card writes failed", failedIds: [second.id] }));
    expect((error as Error).cause).toBeUndefined();
    expect(unexpectedRead).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(beforeWrite);
  });

  it("does not change Card data while bulk writes are pending", async () => {
    const store = createRemoteStore();
    const existing = createCard({ id: "existing" });
    const upsert = createCard({ id: "upsert" });
    const write = deferred<string>();
    dependencies.upsertCard.mockReturnValueOnce(write.promise);
    store.begin(uid);
    store.applySnapshot(uid, "cards", {
      data: { [existing.id]: existing },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrite = store.getSnapshot();
    const service = createCardMutationService(dependencies);

    const operation = service.bulkUpsert(uid, [upsert]);

    await vi.waitFor(() => expect(dependencies.upsertCard).toHaveBeenCalled());
    expect(store.getSnapshot()).toBe(beforeWrite);
    write.resolve(upsert.id);
    await operation;
  });
});
