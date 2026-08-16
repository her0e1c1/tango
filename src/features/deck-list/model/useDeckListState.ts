import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, type Card } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, type DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";
import { downloadDeckCsv } from "../lib/deckCsv";
import { buildDeckListSections } from "./buildDeckListSections";

interface UseDeckListStateOptions {
  decks: Deck[];
  cards: Card[];
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
}

export const useDeckListState = ({ decks, cards, sessionsByDeckId }: UseDeckListStateOptions) => {
  const uid = useAuthUid();
  const [deletionTarget, setDeletionTarget] = React.useState<{ deck: Deck; cardCount: number }>();
  const [deletionErrorDeckId, setDeletionErrorDeckId] = React.useState<DeckId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();

  const cardsForDeck = (id: DeckId) => filterCardsByDeckId(cards, id);

  const requestDeletion = (id: DeckId) => {
    const deck = mustFindDeckById(decks, id);
    setSuccessMessage(undefined);
    setDeletionErrorDeckId(undefined);
    setDeletionTarget({ deck, cardCount: cardsForDeck(id).length });
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null) return;
    const { deck } = deletionTarget;
    setDeletionErrorDeckId(undefined);
    try {
      await deleteDeck(uid, deck);
      setDeletionTarget(undefined);
      setSuccessMessage(`Deleted deck “${deck.name}”.`);
    } catch {
      setDeletionErrorDeckId(deck.id);
    }
  };

  const download = (id: DeckId) => {
    const deck = mustFindDeckById(decks, id);
    downloadDeckCsv(deck, cardsForDeck(id));
  };

  return {
    sections: buildDeckListSections(decks, cards, sessionsByDeckId),
    deletionTarget:
      deletionTarget == null
        ? undefined
        : {
            deckName: deletionTarget.deck.name,
            cardCount: deletionTarget.cardCount,
            hasError: deletionErrorDeckId === deletionTarget.deck.id,
          },
    successMessage,
    onDownload: download,
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => setDeletionTarget(undefined),
    onConfirmDeletion: confirmDeletion,
  };
};

export type DeckListState = ReturnType<typeof useDeckListState>;
