import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyRealtimeChange } from "@/lib/realtimeChange";
import {
  CardBulkMutationError,
  createRemoteStore,
  type RemoteReadDependencies,
  type RemoteSubscriptionProps,
} from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
};

const createHarness = () => {
  const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const dependencies = {
    waitForInitialization: vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status: "ready" })),
    subscribeDecks: vi.fn((props: RemoteSubscriptionProps<Deck>) => {
      deckSubscriptions.push(props);
      return vi.fn();
    }),
    subscribeCards: vi.fn((props: RemoteSubscriptionProps<Card>) => {
      cardSubscriptions.push(props);
      return vi.fn();
    }),
    applyChange: applyRealtimeChange,
    createCard: vi.fn<(card: Card) => Promise<string>>(),
    updateCard: vi.fn<(card: CardEdit) => Promise<void>>(),
    removeCard: vi.fn<(id: CardId) => Promise<void>>(),
    upsertCard: vi.fn<(card: Card) => Promise<string>>(),
    createDeck: vi.fn<(deck: Deck) => Promise<string>>(),
    updateDeck: vi.fn<(deck: DeckEdit) => Promise<void>>(),
    removeDeck: vi.fn<(id: DeckId, uid: string) => Promise<void>>(),
  };
  dependencies.createCard.mockResolvedValue("created");
  dependencies.updateCard.mockResolvedValue(undefined);
  dependencies.removeCard.mockResolvedValue(undefined);
  dependencies.upsertCard.mockResolvedValue("upserted");
  dependencies.createDeck.mockResolvedValue("created");
  dependencies.updateDeck.mockResolvedValue(undefined);
  dependencies.removeDeck.mockResolvedValue(undefined);
  return { store: createRemoteStore(dependencies), dependencies, deckSubscriptions, cardSubscriptions };
};

describe("remote store mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks a pending Card create without publishing the entity before its snapshot", async () => {
    const { store, dependencies, cardSubscriptions } = createHarness();
    const card = createCard({ id: "created" });
    const write = deferred<string>();
    dependencies.createCard.mockReturnValueOnce(write.promise);
    await store.getState().start("uid-a");

    const operation = store.getState().createCard("uid-a", card);

    expect(store.getState().cardMutation).toMatchObject({ uid: "uid-a", error: null });
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map([[card.id, 1]]));
    expect(store.getState().read.cardsById).toEqual({});
    await vi.waitFor(() => expect(dependencies.createCard).toHaveBeenCalledWith(card));
    write.resolve(card.id);
    await operation;
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map());
    expect(store.getState().read.cardsById).toEqual({});

    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getState().read.cardsById).toEqual({ [card.id]: card });
  });

  it("serializes updates for one Card while allowing another Card to update concurrently", async () => {
    const { store, dependencies } = createHarness();
    const first = deferred<void>();
    dependencies.updateCard.mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const cardA = createCard({ id: "a", score: 0 });
    const cardB = createCard({ id: "b", score: 0 });

    const updateA1 = store.getState().updateCard("uid-a", { ...cardA, score: 1 });
    const updateA2 = store.getState().updateCard("uid-a", { ...cardA, score: 2 });
    const updateB = store.getState().updateCard("uid-a", { ...cardB, score: 3 });

    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledTimes(2));
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(1, { ...cardA, score: 1 });
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(2, { ...cardB, score: 3 });
    first.resolve();
    await Promise.all([updateA1, updateA2, updateB]);
    expect(dependencies.updateCard).toHaveBeenNthCalledWith(3, { ...cardA, score: 2 });
  });

  it("routes Card removals and bulk upserts without changing listener-owned data", async () => {
    const { store, dependencies, cardSubscriptions } = createHarness();
    const removed = createCard({ id: "removed" });
    const upserts = [createCard({ id: "first" }), createCard({ id: "second" })];
    await store.getState().start("uid-a");
    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [removed],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrites = store.getState().read.cardsById;

    await store.getState().removeCard("uid-a", removed.id, removed.deckId);
    await store.getState().bulkUpsertCards("uid-a", upserts);

    expect(dependencies.removeCard).toHaveBeenCalledWith(removed.id);
    expect(dependencies.upsertCard).toHaveBeenCalledTimes(2);
    expect(dependencies.upsertCard).toHaveBeenNthCalledWith(1, upserts[0]);
    expect(dependencies.upsertCard).toHaveBeenNthCalledWith(2, upserts[1]);
    expect(store.getState().read.cardsById).toBe(beforeWrites);
  });

  it("reports every failed Card ID from a partial bulk upsert", async () => {
    const { store, dependencies } = createHarness();
    const cards = [createCard({ id: "first" }), createCard({ id: "second" }), createCard({ id: "third" })];
    dependencies.upsertCard.mockImplementation((card) =>
      card.id === "second" || card.id === "third" ? Promise.reject(new Error(card.id)) : Promise.resolve(card.id)
    );

    const error = await store
      .getState()
      .bulkUpsertCards("uid-a", cards)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(CardBulkMutationError);
    expect(error).toEqual(
      expect.objectContaining({ message: "2 of 3 Card writes failed", failedIds: ["second", "third"] })
    );
    expect(store.getState().cardMutation.error).toBe(error);
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map());
  });

  it("isolates Card locks and mutation state by UID", async () => {
    const { store, dependencies } = createHarness();
    const first = deferred<void>();
    const second = deferred<void>();
    dependencies.updateCard.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const card = createCard({ id: "shared" });

    const updateA = store.getState().updateCard("uid-a", card);
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledOnce());
    const updateB = store.getState().updateCard("uid-b", { ...card, uid: "uid-b" });

    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledTimes(2));
    expect(store.getState().cardMutation).toMatchObject({ uid: "uid-b", error: null });
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map([[card.id, 1]]));
    first.resolve();
    await updateA;
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map([[card.id, 1]]));
    second.resolve();
    await updateB;
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map());
  });

  it("publishes fresh per-ID pending maps while Card operations overlap", async () => {
    const { store, dependencies } = createHarness();
    const first = deferred<void>();
    const second = deferred<void>();
    dependencies.updateCard.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const cardA = createCard({ id: "a" });
    const cardB = createCard({ id: "b" });

    const updateA = store.getState().updateCard("uid-a", cardA);
    const firstPending = store.getState().cardMutation.pendingCounts;
    const updateB = store.getState().updateCard("uid-a", cardB);
    const bothPending = store.getState().cardMutation.pendingCounts;

    expect(bothPending).not.toBe(firstPending);
    expect(firstPending).toEqual(new Map([[cardA.id, 1]]));
    expect(bothPending).toEqual(
      new Map([
        [cardA.id, 1],
        [cardB.id, 1],
      ])
    );
    first.resolve();
    await updateA;
    expect(store.getState().cardMutation.pendingCounts).toEqual(new Map([[cardB.id, 1]]));
    second.resolve();
    await updateB;
  });

  it("rejects Card writes for an empty UID and keeps the failure retryable", async () => {
    const { store, dependencies } = createHarness();
    const card = createCard();

    await expect(store.getState().createCard("", card)).rejects.toThrow("confirmed user");

    expect(dependencies.createCard).not.toHaveBeenCalled();
    expect(store.getState().cardMutation.uid).toBe("");
    expect(store.getState().cardMutation.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });

  it("retries the latest Card failure without clearing it after an unrelated success", async () => {
    const { store, dependencies } = createHarness();
    const failed = createCard({ id: "failed" });
    const successful = createCard({ id: "successful" });
    const failure = new Error("failed update");
    dependencies.updateCard.mockImplementation((card) => {
      const attempts = dependencies.updateCard.mock.calls.filter(([value]) => value.id === card.id).length;
      return card.id === failed.id && attempts === 1 ? Promise.reject(failure) : Promise.resolve();
    });

    await expect(store.getState().updateCard("uid-a", failed)).rejects.toBe(failure);
    await store.getState().updateCard("uid-a", successful);

    expect(store.getState().cardMutation.error).toBe(failure);
    await store.getState().retryCardMutation("uid-a");
    expect(dependencies.updateCard.mock.calls.filter(([card]) => card.id === failed.id)).toHaveLength(2);
    expect(store.getState().cardMutation.error).toBeNull();
  });

  it("clears an older same-Card failure only after the newer queued update succeeds", async () => {
    const { store, dependencies } = createHarness();
    const first = createCard({ id: "card", score: 1 });
    const second = { ...first, score: 2 };
    const firstWrite = deferred<void>();
    const failure = new Error("first failed");
    dependencies.updateCard.mockReturnValueOnce(firstWrite.promise).mockResolvedValueOnce(undefined);

    const firstOperation = store.getState().updateCard("uid-a", first);
    const secondOperation = store.getState().updateCard("uid-a", second);
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledOnce());
    firstWrite.reject(failure);
    await expect(firstOperation).rejects.toBe(failure);
    expect(store.getState().cardMutation.error).toBe(failure);
    await secondOperation;

    expect(store.getState().cardMutation.error).toBeNull();
    await store.getState().retryCardMutation("uid-a");
    expect(dependencies.updateCard).toHaveBeenCalledTimes(2);
  });

  it("shares one physical Deck removal and identifies only its initiating caller", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const removal = deferred<void>();
    dependencies.removeDeck.mockReturnValueOnce(removal.promise);

    const first = store.getState().removeDeck("uid-a", deck);
    const duplicate = store.getState().removeDeck("uid-a", deck);
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a"));

    expect(store.getState().deckMutation.pendingCounts).toEqual(new Map([[deck.id, 1]]));
    removal.resolve();
    await expect(first).resolves.toBe(true);
    await expect(duplicate).resolves.toBe(false);
    expect(store.getState().deckMutation.pendingCounts).toEqual(new Map());
  });

  it("gives Deck removal exclusive access to Card membership writes", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    const removal = deferred<void>();
    dependencies.removeDeck.mockReturnValueOnce(removal.promise);

    const remove = store.getState().removeDeck("uid-a", deck);
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledOnce());
    const update = store.getState().updateCard("uid-a", card);
    await Promise.resolve();
    expect(dependencies.updateCard).not.toHaveBeenCalled();

    removal.resolve();
    await remove;
    await update;
    expect(dependencies.updateCard).toHaveBeenCalledWith(card);
  });

  it("routes Deck creates and updates without publishing entities", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck", name: "Before" });

    await store.getState().createDeck("uid-a", deck);
    await store.getState().updateDeck("uid-a", { ...deck, name: "After" });

    expect(dependencies.createDeck).toHaveBeenCalledWith(deck);
    expect(dependencies.updateDeck).toHaveBeenCalledWith({ ...deck, name: "After" });
    expect(store.getState().read.decksById).toEqual({});
  });

  it("serializes one Deck while allowing different Decks and UIDs to update concurrently", async () => {
    const { store, dependencies } = createHarness();
    const first = deferred<void>();
    dependencies.updateDeck.mockReturnValueOnce(first.promise).mockResolvedValue(undefined);
    const deckA = createDeck({ id: "a", name: "Before" });
    const deckB = createDeck({ id: "b", name: "Before" });

    const updateA1 = store.getState().updateDeck("uid-a", { ...deckA, name: "First" });
    const updateA2 = store.getState().updateDeck("uid-a", { ...deckA, name: "Second" });
    const updateB = store.getState().updateDeck("uid-a", { ...deckB, name: "Other" });
    const updateOtherUid = store.getState().updateDeck("uid-b", { ...deckA, uid: "uid-b", name: "Other UID" });

    await vi.waitFor(() => expect(dependencies.updateDeck).toHaveBeenCalledTimes(3));
    expect(dependencies.updateDeck.mock.calls.map(([deck]) => deck.name)).toEqual(["First", "Other", "Other UID"]);
    first.resolve();
    await Promise.all([updateA1, updateA2, updateB, updateOtherUid]);
    expect(dependencies.updateDeck).toHaveBeenLastCalledWith({ ...deckA, name: "Second" });
  });

  it("waits for an in-flight Card membership write before removing its Deck", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    const cardWrite = deferred<void>();
    dependencies.updateCard.mockReturnValueOnce(cardWrite.promise);

    const update = store.getState().updateCard("uid-a", card);
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledOnce());
    const remove = store.getState().removeDeck("uid-a", deck);
    await Promise.resolve();
    expect(dependencies.removeDeck).not.toHaveBeenCalled();

    cardWrite.resolve();
    await update;
    await remove;
    expect(dependencies.removeDeck).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a");
  });

  it("allows Card writes for another Deck or UID during Deck removal", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const removal = deferred<void>();
    dependencies.removeDeck.mockReturnValueOnce(removal.promise);

    const remove = store.getState().removeDeck("uid-a", deck);
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledOnce());
    const otherDeck = store.getState().createCard("uid-a", createCard({ id: "other-deck", deckId: "other" }));
    const otherUid = store
      .getState()
      .updateCard("uid-b", createCard({ id: "other-uid", uid: "uid-b", deckId: deck.id }));

    await vi.waitFor(() => expect(dependencies.createCard).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(dependencies.updateCard).toHaveBeenCalledOnce());
    removal.resolve();
    await Promise.all([remove, otherDeck, otherUid]);
  });

  it("returns the removed Deck from exactly one successful removal retry", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const failure = new Error("remove failed");
    const retry = deferred<void>();
    dependencies.removeDeck.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    await expect(store.getState().removeDeck("uid-a", deck)).rejects.toBe(failure);

    const firstRetry = store.getState().retryDeckMutation("uid-a");
    const duplicateRetry = store.getState().retryDeckMutation("uid-a");
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledTimes(2));
    retry.resolve();

    await expect(firstRetry).resolves.toBe(deck);
    await expect(duplicateRetry).resolves.toBeUndefined();
    expect(store.getState().deckMutation.error).toBeNull();
  });

  it("does not start a retry after a newer in-flight removal clears the failure", async () => {
    const { store, dependencies } = createHarness();
    const deck = createDeck({ id: "deck" });
    const failure = new Error("remove failed");
    const removal = deferred<void>();
    dependencies.removeDeck.mockRejectedValueOnce(failure).mockReturnValueOnce(removal.promise);
    await expect(store.getState().removeDeck("uid-a", deck)).rejects.toBe(failure);

    const manualRemoval = store.getState().removeDeck("uid-a", deck);
    const retry = store.getState().retryDeckMutation("uid-a");
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledTimes(2));
    removal.resolve();

    await expect(manualRemoval).resolves.toBe(true);
    await expect(retry).resolves.toBeUndefined();
    expect(dependencies.removeDeck).toHaveBeenCalledTimes(2);
    expect(store.getState().deckMutation.error).toBeNull();
  });

  it("keeps the latest Deck failure after an unrelated Deck succeeds", async () => {
    const { store, dependencies } = createHarness();
    const failed = createDeck({ id: "failed" });
    const successful = createDeck({ id: "successful" });
    const failure = new Error("failed update");
    dependencies.updateDeck.mockImplementation((deck) => {
      const attempts = dependencies.updateDeck.mock.calls.filter(([value]) => value.id === deck.id).length;
      return deck.id === failed.id && attempts === 1 ? Promise.reject(failure) : Promise.resolve();
    });

    await expect(store.getState().updateDeck("uid-a", failed)).rejects.toBe(failure);
    await store.getState().updateDeck("uid-a", successful);

    expect(store.getState().deckMutation.error).toBe(failure);
    await store.getState().retryDeckMutation("uid-a");
    expect(dependencies.updateDeck.mock.calls.filter(([deck]) => deck.id === failed.id)).toHaveLength(2);
    expect(store.getState().deckMutation.error).toBeNull();
  });

  it("ignores a stale Deck completion after the mutation UID changes", async () => {
    const { store, dependencies } = createHarness();
    const oldWrite = deferred<void>();
    const newWrite = deferred<void>();
    dependencies.updateDeck.mockReturnValueOnce(oldWrite.promise).mockReturnValueOnce(newWrite.promise);
    const deck = createDeck({ id: "shared" });

    const oldOperation = store.getState().updateDeck("uid-a", deck);
    await vi.waitFor(() => expect(dependencies.updateDeck).toHaveBeenCalledOnce());
    const newOperation = store.getState().updateDeck("uid-b", { ...deck, uid: "uid-b" });
    await vi.waitFor(() => expect(dependencies.updateDeck).toHaveBeenCalledTimes(2));
    oldWrite.resolve();
    await oldOperation;

    expect(store.getState().deckMutation.uid).toBe("uid-b");
    expect(store.getState().deckMutation.pendingCounts).toEqual(new Map([[deck.id, 1]]));
    newWrite.resolve();
    await newOperation;
  });
});
