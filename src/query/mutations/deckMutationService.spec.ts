/**
 * @file Verifies the "createDeckMutationService" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "rolls back a failed Deck
 * update", "rolls back a failed Deck delete together with its child Cards", "waits for a child
 * Card mutation before deleting its Deck".
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCardMutationService } from "@/query/mutations/cardMutationService";
import { createDeckMutationService } from "@/query/mutations/deckMutationService";
import { createRemoteStore, type RemoteStore } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

/**
 * Provides the deferred test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("createDeckMutationService", () => {
  const uid = "uid-a";
  let store: RemoteStore;
  const dependencies = {
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    removeDeck: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createRemoteStore();
    store.begin(uid);
    dependencies.createDeck.mockResolvedValue("deck");
    dependencies.updateDeck.mockResolvedValue(undefined);
    dependencies.removeDeck.mockResolvedValue(undefined);
  });

  it("leaves listener-owned data unchanged after a failed Deck update", async () => {
    const deck = createDeck({ id: "deck", name: "Before" });
    store.replace(uid, "decks", { deck });
    dependencies.updateDeck.mockRejectedValueOnce(new Error("failed"));
    const service = createDeckMutationService({ store, ...dependencies });

    await expect(service.update(uid, { ...deck, name: "After" })).rejects.toThrow("failed");
    expect(store.read(uid, "decks")).toEqual({ deck });
  });

  it("rolls back a failed Deck delete together with its child Cards", async () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    store.replace(uid, "decks", { deck });
    store.replace(uid, "cards", { card });
    dependencies.removeDeck.mockRejectedValueOnce(new Error("failed"));
    const service = createDeckMutationService({ store, ...dependencies });

    await expect(service.remove(uid, deck.id)).rejects.toThrow("failed");
    expect(store.read(uid, "decks")).toEqual({ deck });
    expect(store.read(uid, "cards")).toEqual({ card });
  });

  it("waits for a child Card mutation before deleting its Deck", async () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    store.replace(uid, "decks", { deck });
    store.replace(uid, "cards", { card });
    const write = deferred();
    const updateCard = vi.fn(() => write.promise);
    const cardService = createCardMutationService({
      store,
      createCard: vi.fn(),
      updateCard,
      removeCard: vi.fn(),
      upsertCard: vi.fn(),
      readCards: vi.fn(),
    });
    const deckService = createDeckMutationService({ store, ...dependencies });

    const update = cardService.update(uid, { ...card, score: 1 });
    await vi.waitFor(() => expect(updateCard).toHaveBeenCalled());
    const remove = deckService.remove(uid, deck.id);
    expect(dependencies.removeDeck).not.toHaveBeenCalled();
    write.resolve();
    await update;
    await remove;
    expect(dependencies.removeDeck).toHaveBeenCalledWith(deck.id, uid);
  });

  it("allows different users to update the same Deck ID concurrently", async () => {
    const deck = createDeck({ id: "shared", name: "Before" });
    const first = deferred();
    dependencies.updateDeck.mockImplementationOnce(() => first.promise).mockResolvedValueOnce(undefined);
    const service = createDeckMutationService({ store, ...dependencies });

    const updateA = service.update("uid-a", { ...deck, name: "First" });
    await vi.waitFor(() => expect(dependencies.updateDeck).toHaveBeenCalledOnce());
    const updateB = service.update("uid-b", { ...deck, name: "Second" });
    try {
      await Promise.resolve();
      expect(dependencies.updateDeck).toHaveBeenCalledTimes(2);
      expect(dependencies.updateDeck).toHaveBeenLastCalledWith({ ...deck, name: "Second" });
    } finally {
      first.resolve();
      await Promise.all([updateA, updateB]);
    }
  });
});
