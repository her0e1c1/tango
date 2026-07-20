import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCardMutationService } from "@/query/mutations/cardMutationService";
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

  it("serializes Deck removal with every Card write for the same Deck membership", async () => {
    const deck = createDeck({ id: "deck" });
    const cardToCreate = createCard({ id: "create", deckId: deck.id });
    const cardToUpdate = createCard({ id: "update", deckId: deck.id });
    const cardToRemove = createCard({ id: "remove", deckId: deck.id });
    const cardToUpsert = createCard({ id: "upsert", deckId: deck.id });
    const removal = deferred();
    dependencies.removeDeck.mockReturnValueOnce(removal.promise);
    const cardDependencies = {
      createCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("create"),
      updateCard: vi.fn<(card: CardEdit) => Promise<void>>().mockResolvedValue(undefined),
      removeCard: vi.fn<(id: CardId) => Promise<void>>().mockResolvedValue(undefined),
      upsertCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("upsert"),
    };
    const deckService = createDeckMutationService(dependencies);
    const cardService = createCardMutationService(cardDependencies);

    const removeDeck = deckService.remove(uid, deck.id);
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledOnce());
    const cardWrites = [
      cardService.create(uid, cardToCreate),
      cardService.update(uid, cardToUpdate),
      cardService.remove(uid, cardToRemove.id, deck.id),
      cardService.bulkUpsert(uid, [cardToUpsert]),
    ];
    await Promise.resolve();
    const callsWhileRemoving = {
      create: cardDependencies.createCard.mock.calls.length,
      update: cardDependencies.updateCard.mock.calls.length,
      remove: cardDependencies.removeCard.mock.calls.length,
      upsert: cardDependencies.upsertCard.mock.calls.length,
    };

    removal.resolve();
    await Promise.all([removeDeck, ...cardWrites]);
    expect(callsWhileRemoving).toEqual({ create: 0, update: 0, remove: 0, upsert: 0 });
    expect(cardDependencies.createCard).toHaveBeenCalledWith(cardToCreate);
    expect(cardDependencies.updateCard).toHaveBeenCalledWith(cardToUpdate);
    expect(cardDependencies.removeCard).toHaveBeenCalledWith(cardToRemove.id);
    expect(cardDependencies.upsertCard).toHaveBeenCalledWith(cardToUpsert);
  });

  it("allows Card writes for another Deck or UID during Deck removal", async () => {
    const deck = createDeck({ id: "deck" });
    const removal = deferred();
    dependencies.removeDeck.mockReturnValueOnce(removal.promise);
    const cardDependencies = {
      createCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("created"),
      updateCard: vi.fn<(card: CardEdit) => Promise<void>>().mockResolvedValue(undefined),
      removeCard: vi.fn<(id: CardId) => Promise<void>>().mockResolvedValue(undefined),
      upsertCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("upserted"),
    };
    const deckService = createDeckMutationService(dependencies);
    const cardService = createCardMutationService(cardDependencies);

    const removeDeck = deckService.remove("uid-a", deck.id);
    await vi.waitFor(() => expect(dependencies.removeDeck).toHaveBeenCalledOnce());
    const otherDeckWrite = cardService.create("uid-a", createCard({ id: "other-deck", deckId: "other" }));
    const otherUidWrite = cardService.update("uid-b", createCard({ id: "other-uid", deckId: deck.id }));

    await vi.waitFor(() => expect(cardDependencies.createCard).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(cardDependencies.updateCard).toHaveBeenCalledOnce());
    removal.resolve();
    await Promise.all([removeDeck, otherDeckWrite, otherUidWrite]);
  });

  it("waits for an in-flight Card membership write before starting Deck removal", async () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    const cardWrite = deferred();
    const cardDependencies = {
      createCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("created"),
      updateCard: vi.fn<(card: CardEdit) => Promise<void>>().mockReturnValueOnce(cardWrite.promise),
      removeCard: vi.fn<(id: CardId) => Promise<void>>().mockResolvedValue(undefined),
      upsertCard: vi.fn<(card: Card) => Promise<string>>().mockResolvedValue("upserted"),
    };
    const deckService = createDeckMutationService(dependencies);
    const cardService = createCardMutationService(cardDependencies);

    const updateCard = cardService.update(uid, card);
    await vi.waitFor(() => expect(cardDependencies.updateCard).toHaveBeenCalledOnce());
    const removeDeck = deckService.remove(uid, deck.id);
    await Promise.resolve();
    const removalCallsWhileWriting = dependencies.removeDeck.mock.calls.length;

    cardWrite.resolve();
    await Promise.all([updateCard, removeDeck]);
    expect(removalCallsWhileWriting).toBe(0);
    expect(dependencies.removeDeck).toHaveBeenCalledOnce();
  });
});
