import type { QueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";

import { firestoreKeys } from "@/query/firestoreKeys";
import { cardMutationLock, deckMutationLock, withMutationLocks } from "@/query/mutationLocks";
import type { RemoteById } from "@/query/remoteReadController";

export interface DeckMutationServiceDependencies {
  client: QueryClient;
  createDeck: (deck: Deck) => Promise<string>;
  updateDeck: (deck: DeckEdit) => Promise<void>;
  removeDeck: (deckId: DeckId, uid: string) => Promise<void>;
}

export const createDeckMutationService = (dependencies: DeckMutationServiceDependencies) => {
  const decks = (uid: string) => dependencies.client.getQueryData<RemoteById<Deck>>(firestoreKeys.decks(uid)) ?? {};
  const cards = (uid: string) => dependencies.client.getQueryData<RemoteById<Card>>(firestoreKeys.cards(uid)) ?? {};
  const setDecks = (uid: string, next: RemoteById<Deck>) =>
    dependencies.client.setQueryData(firestoreKeys.decks(uid), next);
  const setCards = (uid: string, next: RemoteById<Card>) =>
    dependencies.client.setQueryData(firestoreKeys.cards(uid), next);

  return {
    create: (uid: string, deck: Deck) =>
      withMutationLocks([deckMutationLock(deck.id)], async () => {
        const previous = decks(uid);
        setDecks(uid, { ...previous, [deck.id]: deck });
        try {
          return await dependencies.createDeck(deck);
        } catch (error) {
          const current = decks(uid);
          if (isEqual(current[deck.id], deck)) {
            const rollback = { ...current };
            if (previous[deck.id] == null) delete rollback[deck.id];
            else rollback[deck.id] = previous[deck.id];
            setDecks(uid, rollback);
          }
          throw error;
        }
      }),
    update: (uid: string, patch: DeckEdit) =>
      withMutationLocks([deckMutationLock(patch.id)], async () => {
        const previous = decks(uid);
        const currentDeck = previous[patch.id];
        if (currentDeck == null) throw new Error(`Deck ${patch.id} is not available`);
        const optimistic = { ...currentDeck, ...patch };
        setDecks(uid, { ...previous, [patch.id]: optimistic });
        try {
          await dependencies.updateDeck(patch);
        } catch (error) {
          const current = decks(uid);
          if (isEqual(current[patch.id], optimistic)) setDecks(uid, { ...current, [patch.id]: currentDeck });
          throw error;
        }
      }),
    remove: (uid: string, id: DeckId) => {
      const childIds = Object.values(cards(uid))
        .filter((card): card is Card => card?.deckId === id)
        .map((card) => card.id);
      return withMutationLocks([deckMutationLock(id), ...childIds.map(cardMutationLock)], async () => {
        const previousDecks = decks(uid);
        const previousCards = cards(uid);
        const nextDecks = { ...previousDecks };
        const nextCards = { ...previousCards };
        delete nextDecks[id];
        childIds.forEach((cardId) => {
          delete nextCards[cardId];
        });
        setDecks(uid, nextDecks);
        setCards(uid, nextCards);
        try {
          await dependencies.removeDeck(id, uid);
        } catch (error) {
          const currentDecks = decks(uid);
          const currentCards = cards(uid);
          const rollbackDecks = { ...currentDecks };
          const rollbackCards = { ...currentCards };
          if (currentDecks[id] == null && previousDecks[id] != null) rollbackDecks[id] = previousDecks[id];
          childIds.forEach((cardId) => {
            if (currentCards[cardId] == null && previousCards[cardId] != null) {
              rollbackCards[cardId] = previousCards[cardId];
            }
          });
          setDecks(uid, rollbackDecks);
          setCards(uid, rollbackCards);
          throw error;
        }
      });
    },
  };
};
