import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { countCardsByDeckId, filterCardsByDeckId, type Card, useCards } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, type DeckId, useDecks } from "@/entities/deck";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  type StudySession,
  touchStudySession,
  useStudySessions,
} from "@/entities/study-session";
import { downloadDeckCsv } from "../lib/deckCsv";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
) => {
  const cardCounts = countCardsByDeckId(cards);
  const createItem = (deck: Pick<Deck, "id" | "name" | "category" | "isPublic">, session?: StudySession) => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
    ...(session == null
      ? {}
      : {
          studyProgress: {
            currentIndex: session.currentIndex,
            cardCount: session.cardOrderIds.length,
            lastStudiedAt: session.lastStudiedAt,
          },
        }),
  });
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  studyingDecks.sort(compareActiveDecks);
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => createItem(deck, session)),
    other: otherDecks.map((deck) => createItem(deck)),
  };
};

export const useDeckListState = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
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
    onContinueStudy: touchStudySession,
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => setDeletionTarget(undefined),
    onConfirmDeletion: confirmDeletion,
  };
};

export type DeckListState = ReturnType<typeof useDeckListState>;
