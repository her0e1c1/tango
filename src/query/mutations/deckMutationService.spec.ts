import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeckMutationService } from "@/query/mutations/deckMutationService";
import { createRemoteStore } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("createDeckMutationService", () => {
  const uid = "uid-a";
  const dependencies = {
    createDeck: vi.fn<(deck: Deck) => Promise<string>>(),
    updateDeck: vi.fn<(deck: DeckEdit) => Promise<void>>(),
    removeDeck: vi.fn<(deckId: DeckId, uid: string) => Promise<void>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.createDeck.mockResolvedValue("deck");
    dependencies.updateDeck.mockResolvedValue(undefined);
    dependencies.removeDeck.mockResolvedValue(undefined);
  });

  it("uses only adapters and leaves Deck and Card data unchanged until applySnapshot", async () => {
    const store = createRemoteStore();
    const deck = createDeck({ id: "deck", name: "Before" });
    const card = createCard({ id: "card", deckId: deck.id });
    store.begin(uid);
    store.applySnapshot(uid, "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    store.applySnapshot(uid, "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrite = store.getSnapshot();
    const service = createDeckMutationService(dependencies);

    await service.create(uid, deck);
    await service.update(uid, { ...deck, name: "After" });
    await service.remove(uid, deck.id);

    expect(dependencies.createDeck).toHaveBeenCalledWith(deck);
    expect(dependencies.updateDeck).toHaveBeenCalledWith({ ...deck, name: "After" });
    expect(dependencies.removeDeck).toHaveBeenCalledOnce();
    expect(dependencies.removeDeck).toHaveBeenCalledWith(deck.id, uid);
    expect(store.getSnapshot()).toBe(beforeWrite);

    store.applySnapshot(uid, "decks", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    store.applySnapshot(uid, "cards", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getSnapshot()).toMatchObject({ decksById: {}, cardsById: {} });
  });

  it("does not hide or restore listener-owned data when Deck removal fails", async () => {
    const store = createRemoteStore();
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    store.begin(uid);
    store.applySnapshot(uid, "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    store.applySnapshot(uid, "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeWrite = store.getSnapshot();
    dependencies.removeDeck.mockRejectedValueOnce(new Error("failed"));
    const service = createDeckMutationService(dependencies);

    await expect(service.remove(uid, deck.id)).rejects.toThrow("failed");

    expect(dependencies.removeDeck).toHaveBeenCalledOnce();
    expect(store.getSnapshot()).toBe(beforeWrite);
  });

  it("serializes Deck removal by UID and Deck ID", async () => {
    const deck = createDeck({ id: "shared", name: "Before" });
    const first = deferred();
    dependencies.updateDeck.mockImplementationOnce(() => first.promise);
    const service = createDeckMutationService(dependencies);

    const updateA = service.update("uid-a", { ...deck, name: "After" });
    await vi.waitFor(() => expect(dependencies.updateDeck).toHaveBeenCalledOnce());
    const removeA = service.remove("uid-a", deck.id);
    const removeB = service.remove("uid-b", deck.id);

    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledOnce());
    expect(dependencies.removeDeck).toHaveBeenCalledWith(deck.id, "uid-b");

    first.resolve();
    await Promise.all([updateA, removeA, removeB]);
    expect(dependencies.removeDeck).toHaveBeenCalledTimes(2);
    expect(dependencies.removeDeck).toHaveBeenLastCalledWith(deck.id, "uid-a");
  });
});
