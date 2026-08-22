import type { z } from "zod";
import type { DeckCreateInput, DeckId, LocalDeckCreateInput } from "../model/types";

import { deleteLocalCardsByDeckId, getLocalCardsByDeckId } from "@/entities/card/@x/deck";
import { removeStudySession } from "@/entities/study-session/@x/deck";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { createLocalDeck, deckStore, deleteLocalDeck, editLocalDeck, findDeckById } from "../model/store";
import { authenticatedUidSchema, deckEditSchema } from "../model/schema";
import {
  createDeck as createRemoteDeck,
  createDeckWithCards as createRemoteDeckWithCards,
  deleteDeck as deleteRemoteDeck,
  editDeck as editRemoteDeck,
} from "./firestore";

// Returns the current Deck or rejects a stale Deck reference.
const requireDeck = (id: DeckId) => {
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  return deck;
};

const moveLocalDeckToRemote = async (
  uid: string,
  currentDeck: Extract<ReturnType<typeof requireDeck>, { localMode: true }>,
  edit: z.infer<typeof deckEditSchema>
): Promise<void> => {
  const userId = authenticatedUidSchema.parse(uid);
  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    localMode: _localMode,
    url: _currentUrl,
    ...currentValues
  } = currentDeck;
  const { localMode: _requestedLocalMode, url: _editedUrl, ...editedValues } = edit;
  const url = edit.url === null ? undefined : (edit.url ?? currentDeck.url);
  const remoteDeck = {
    ...currentValues,
    ...omitUndefined(editedValues),
    ...(url === undefined ? {} : { url }),
    uid: userId,
    localMode: false as const,
  } satisfies DeckCreateInput;
  const localCards = getLocalCardsByDeckId(currentDeck.id);
  const remoteCards = localCards.map(({ createdAt: _cardCreatedAt, updatedAt: _cardUpdatedAt, ...card }) => ({
    ...card,
    uid: userId,
  }));

  // The single batch is the consistency boundary: a failed attempt cannot remove or partially replace another attempt.
  await createRemoteDeckWithCards(userId, remoteDeck, remoteCards);

  const latestLocalDeck = deckStore.getState().localDecks.find(({ id }) => id === currentDeck.id);
  const latestLocalCards = getLocalCardsByDeckId(currentDeck.id);
  if (latestLocalDeck === undefined && latestLocalCards.length === 0) return;

  // Store mutations replace objects, so identity plus length detects any edit, addition, or deletion during the async commit.
  const cardsUnchanged =
    latestLocalCards.length === localCards.length &&
    latestLocalCards.every((card, index) => card === localCards[index]);
  if (latestLocalDeck !== currentDeck || !cardsUnchanged) {
    throw new Error(
      "The local Deck or its Cards changed while moving to Firestore. Save again to migrate the latest data"
    );
  }

  deleteLocalCardsByDeckId(currentDeck.id);
  deleteLocalDeck(currentDeck.id);
};

// Routes a Deck create through the payload's persistence mode.
export const createDeck = async (uid: string, deck: DeckCreateInput | LocalDeckCreateInput): Promise<void> => {
  if (deck.localMode) {
    createLocalDeck(deck);
    return;
  }
  await createRemoteDeck(uid, deck);
};

// Routes an edit through the stored mode or performs the supported one-way local-to-remote move.
export const editDeck = async (uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> => {
  const currentDeck = requireDeck(deck.id);
  const edit = deckEditSchema.parse(deck);
  if (currentDeck.localMode) {
    if (edit.localMode === false) {
      await moveLocalDeckToRemote(uid, currentDeck, edit);
      return;
    }
    editLocalDeck(edit);
    return;
  }
  if (edit.localMode === true) throw new Error("A remote Deck cannot be moved to local storage");
  await editRemoteDeck(uid, edit);
};

// Deletes a Deck and its owned local or remote resources before clearing its study session.
export const deleteDeck = async (uid: string, deckId: DeckId): Promise<void> => {
  const currentDeck = requireDeck(deckId);
  if (currentDeck.localMode) {
    deleteLocalCardsByDeckId(deckId);
    deleteLocalDeck(deckId);
  } else {
    const userId = authenticatedUidSchema.parse(uid);
    if (currentDeck.uid !== userId) throw new Error("Deck owner does not match the authenticated user");
    await deleteRemoteDeck(userId, deckId);
  }

  // A deleted Deck must not leave a resumable session behind in persisted client state.
  removeStudySession(deckId);
};
