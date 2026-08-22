import type {
  CardCreateInput,
  CardEditInput,
  CardId,
  CardMutation,
  CardMutationCreateInput,
  RemoteCard,
} from "../model/types";

import { findDeckById } from "@/entities/deck/@x/card";
import { cardCreateSchema } from "../model/schema";
import {
  cardStore,
  createLocalCard,
  deleteLocalCard,
  deleteLocalCardsByDeckId,
  editLocalCard,
  findCardById,
} from "../model/store";
import {
  createCard as createRemoteCard,
  deleteCard as deleteRemoteCard,
  editCard as editRemoteCard,
} from "./firestore";

// The owning Deck is the source of truth for persistence mode; callers cannot route individual Cards independently.
const isLocalDeck = (deckId: string): boolean => findDeckById(deckId)?.localMode ?? false;

// Returns the current Card or rejects a stale Card reference.
const requireCard = (id: CardId) => {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  return card;
};

// Returns the owning Deck's persistence mode or rejects an unknown Deck.
const requireLocalMode = (deckId: string): boolean => {
  const deck = findDeckById(deckId);
  if (deck === undefined) throw new Error(`Deck "${deckId}" was not found`);
  return deck.localMode;
};

// Validates the owner-bearing payload required for a remote Card create.
const requireRemoteCardCreate = (card: CardMutationCreateInput): CardCreateInput =>
  "uid" in card ? card : cardCreateSchema.parse(card);

// Routes a Card create through the owning Deck's persistence mode.
const createCard = async (uid: string, card: CardMutationCreateInput): Promise<void> => {
  if (isLocalDeck(card.deckId)) {
    createLocalCard(card);
    return;
  }
  await createRemoteCard(uid, requireRemoteCardCreate(card));
};

// Copies a Deck's local Cards to remote persistence before removing the local copies.
export const moveLocalCardsToRemote = async (uid: string, deckId: string): Promise<void> => {
  const localCards = cardStore.getState().localCards.filter((card) => card.deckId === deckId);
  await Promise.all(
    localCards.map(({ createdAt: _createdAt, updatedAt: _updatedAt, ...card }) =>
      createRemoteCard(uid, { ...card, uid })
    )
  );
  deleteLocalCardsByDeckId(deckId);
};

// Narrows a stored Card to the owner-bearing remote variant.
const requireRemoteCard = (card: ReturnType<typeof requireCard>): RemoteCard => {
  if (!("uid" in card)) throw new Error(`Card "${card.id}" is not owned by a remote Deck`);
  return card;
};

// Routes a Card edit through the owning Deck's persistence mode.
export const editCard = async (uid: string, card: CardEditInput): Promise<void> => {
  const currentCard = requireCard(card.id);
  if (requireLocalMode(currentCard.deckId)) {
    editLocalCard(card);
    return;
  }
  // Preserve the stored owner so an edit payload cannot move a remote Card between accounts.
  await editRemoteCard(uid, { ...card, uid: requireRemoteCard(currentCard).uid });
};

// Applies independent Card mutations and reports the first failed operation after all settle.
export const mutateCards = async (uid: string, mutations: CardMutation[]): Promise<void> => {
  // Bulk imports are non-transactional: let every independent write settle before surfacing the first failure.
  const results = await Promise.allSettled(
    mutations.map((mutation) =>
      mutation.kind === "create" ? createCard(uid, mutation.card) : editCard(uid, mutation.card)
    )
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
};

// Routes a Card deletion through the owning Deck's persistence mode.
export const deleteCard = async (uid: string, card: { id: CardId }): Promise<void> => {
  const currentCard = requireCard(card.id);
  if (requireLocalMode(currentCard.deckId)) {
    deleteLocalCard(card.id);
    return;
  }
  await deleteRemoteCard(uid, { id: card.id, uid: requireRemoteCard(currentCard).uid });
};
