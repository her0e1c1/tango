import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { countCardsByDeckId, filterCardsByDeckId, type Card } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, type DeckId } from "@/entities/deck";
import { compareActiveDecks, groupDecksByStudyStatus, type StudySession } from "@/entities/study-session";
import { downloadDeckCsv } from "../lib/deckCsv";

interface UseDeckListStateOptions {
  decks: Deck[];
  cards: Card[];
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
}

interface DeletionTarget {
  deck: Deck;
  cardCount: number;
}

export interface DeckListStudyProgress {
  currentIndex: number;
  cardCount: number;
  lastStudiedAt: number;
}

export type DeckListDeck = Pick<Deck, "id" | "name" | "category" | "isPublic">;

export interface DeckListItem {
  deck: DeckListDeck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

export interface DeckListSections {
  studying: DeckListItem[];
  other: DeckListItem[];
}

export interface DeckListState {
  sections: DeckListSections;
  deletionTarget: { deckName: string; cardCount: number; hasError: boolean } | undefined;
  successMessage: string | undefined;
  onDownload: (id: DeckId) => void;
  onRequestDeletion: (id: DeckId) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => Promise<void>;
}

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

const createDeckListStudyProgress = (session: StudySession): DeckListStudyProgress => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});

const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): DeckListSections => {
  const cardCounts = countCardsByDeckId(cards);
  const createItem = (deck: Deck): DeckListItem => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
  });
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  studyingDecks.sort(compareActiveDecks);
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => ({
      ...createItem(deck),
      studyProgress: createDeckListStudyProgress(session),
    })),
    other: otherDecks.map(createItem),
  };
};

export const useDeckListState = ({ decks, cards, sessionsByDeckId }: UseDeckListStateOptions): DeckListState => {
  const uid = useAuthUid();
  const [deletionTarget, setDeletionTarget] = React.useState<DeletionTarget>();
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
