import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCardMutationService } from "@/query/cardMutationService";
import { createDeckMutationService } from "@/query/deckMutationService";
import { firestoreKeys } from "@/query/cache/firestoreKeys";
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
  let client: QueryClient;
  const dependencies = {
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    removeDeck: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient();
    dependencies.createDeck.mockResolvedValue("deck");
    dependencies.updateDeck.mockResolvedValue(undefined);
    dependencies.removeDeck.mockResolvedValue(undefined);
  });

  it("rolls back a failed Deck update", async () => {
    const deck = createDeck({ id: "deck", name: "Before" });
    client.setQueryData(firestoreKeys.decks(uid), { deck });
    dependencies.updateDeck.mockRejectedValueOnce(new Error("failed"));
    const service = createDeckMutationService({ client, ...dependencies });

    await expect(service.update(uid, { ...deck, name: "After" })).rejects.toThrow("failed");
    expect(client.getQueryData(firestoreKeys.decks(uid))).toEqual({ deck });
  });

  it("rolls back a failed Deck delete together with its child Cards", async () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    client.setQueryData(firestoreKeys.decks(uid), { deck });
    client.setQueryData(firestoreKeys.cards(uid), { card });
    dependencies.removeDeck.mockRejectedValueOnce(new Error("failed"));
    const service = createDeckMutationService({ client, ...dependencies });

    await expect(service.remove(uid, deck.id)).rejects.toThrow("failed");
    expect(client.getQueryData(firestoreKeys.decks(uid))).toEqual({ deck });
    expect(client.getQueryData(firestoreKeys.cards(uid))).toEqual({ card });
  });

  it("waits for a child Card mutation before deleting its Deck", async () => {
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });
    client.setQueryData(firestoreKeys.decks(uid), { deck });
    client.setQueryData(firestoreKeys.cards(uid), { card });
    const write = deferred();
    const updateCard = vi.fn(() => write.promise);
    const cardService = createCardMutationService({
      client,
      createCard: vi.fn(),
      updateCard,
      removeCard: vi.fn(),
      upsertCard: vi.fn(),
      readCards: vi.fn(),
    });
    const deckService = createDeckMutationService({ client, ...dependencies });

    const update = cardService.update(uid, { ...card, score: 1 });
    await vi.waitFor(() => expect(updateCard).toHaveBeenCalled());
    const remove = deckService.remove(uid, deck.id);
    expect(dependencies.removeDeck).not.toHaveBeenCalled();
    write.resolve();
    await update;
    await remove;
    expect(dependencies.removeDeck).toHaveBeenCalledWith(deck.id, uid);
  });
});
