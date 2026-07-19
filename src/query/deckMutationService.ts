import type { QueryClient } from "@tanstack/react-query";

import { firestoreKeys } from "@/query/cache/firestoreKeys";
import type { RemoteById } from "@/query/cache/remoteCollection";
import { cardMutationLock, deckMutationLock, withMutationLocks } from "@/query/mutationLocks";
import { runOptimisticMutation } from "@/query/remoteCollection";

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
  const optimisticDeck = <T>(
    uid: string,
    id: DeckId,
    update: (previous: RemoteById<Deck>) => RemoteById<Deck>,
    mutation: () => Promise<T>
  ) =>
    withMutationLocks([deckMutationLock(id)], () =>
      runOptimisticMutation({
        targetIds: [id],
        read: () => decks(uid),
        replace: (decks) => setDecks(uid, decks),
        update,
        mutation,
      })
    );

  return {
    create: (uid: string, deck: Deck) =>
      optimisticDeck(
        uid,
        deck.id,
        (previous) => ({ ...previous, [deck.id]: deck }),
        () => dependencies.createDeck(deck)
      ),
    update: (uid: string, patch: DeckEdit) =>
      optimisticDeck(
        uid,
        patch.id,
        (previous) => {
          const current = previous[patch.id];
          if (current == null) throw new Error(`Deck ${patch.id} is not available`);
          return { ...previous, [patch.id]: { ...current, ...patch } };
        },
        () => dependencies.updateDeck(patch)
      ),
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
