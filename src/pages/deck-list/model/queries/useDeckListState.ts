import { useStore } from "zustand";

import { useStudyCards } from "@/entities/card-study-state";
import type { Card } from "@/entities/card";
import type { FsrsState } from "@/entities/card-study-state";
type StudyCard = Card & { fsrs: FsrsState | null };
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { classifyFsrsState } from "@/entities/card-study-state";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  selectStudyCardsWithDeadline,
  type StudySession,
  useStudySessions,
} from "@/entities/study-session";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";

import { deckListStore, type DeckListBootstrapStatus } from "../store";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

function summarizeDeck(cards: StudyCard[], deck: Deck, now: number) {
  const selected = selectStudyCardsWithDeadline(cards, deck, true, now);
  let due = 0;
  let newCount = 0;
  let earliestDueAt: number | undefined;
  for (const card of selected.cards) {
    const timing = classifyFsrsState(card.fsrs, now);
    if (timing.status === "new") newCount += 1;
    else if (timing.status === "due") {
      due += 1;
      earliestDueAt = Math.min(earliestDueAt ?? timing.dueAt, timing.dueAt);
    }
  }
  return { due, new: newCount, earliestDueAt, nextDueAt: selected.nextDueAt };
}

export type DeckListEmptyReason = "checking" | "error" | "confirmed-empty";

interface DeriveDeckListEmptyReasonOptions {
  rawCount: number;
  loadSample: boolean;
  bootstrapStatus: DeckListBootstrapStatus;
}

function deriveDeckListEmptyReason({
  rawCount,
  loadSample,
  bootstrapStatus,
}: DeriveDeckListEmptyReasonOptions): DeckListEmptyReason | undefined {
  if (rawCount > 0) return undefined;
  if (loadSample && (bootstrapStatus === "checking" || bootstrapStatus === "idle")) return "checking";
  if (loadSample && bootstrapStatus === "error") return "error";
  return "confirmed-empty";
}

function buildDeckListSections(
  {
    decks,
    cards,
    sessionsByDeckId,
    enabled,
  }: {
    decks: Deck[];
    cards: StudyCard[];
    sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
    enabled: boolean;
  },
  now: number
) {
  const cardsByDeck = new Map<DeckId, StudyCard[]>();
  for (const card of cards) {
    const group = cardsByDeck.get(card.deckId) ?? [];
    group.push(card);
    cardsByDeck.set(card.deckId, group);
  }
  let nextDueAt: number | undefined;
  const totals = { due: 0, new: 0 };
  const buildItem = (deck: Deck) => {
    const deckCards = cardsByDeck.get(deck.id) ?? [];
    const review = enabled ? summarizeDeck(deckCards, deck, now) : undefined;
    if (review) {
      totals.due += review.due;
      totals.new += review.new;
      if (review.nextDueAt !== undefined) nextDueAt = Math.min(nextDueAt ?? review.nextDueAt, review.nextDueAt);
    }
    return { deck, cardCount: deckCards.length, ...(review ? { review } : {}) };
  };
  const { active, inactive } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  const studying = active
    .sort(compareActiveDecks)
    .map(({ deck, session }) => ({ ...buildItem(deck), studySession: session }));
  const remaining = inactive.sort(compareDeckNames).map(buildItem);
  const reviewNow = remaining.filter((item) => item.review && item.review.due + item.review.new > 0);
  reviewNow.sort(
    (a, b) =>
      (a.review?.earliestDueAt ?? Number.POSITIVE_INFINITY) - (b.review?.earliestDueAt ?? Number.POSITIVE_INFINITY) ||
      compareDeckNames(a.deck, b.deck)
  );
  const other = remaining.filter((item) => !item.review || item.review.due + item.review.new === 0);
  return { studying, reviewNow, other, ...(enabled ? { totals } : {}), nextDueAt };
}

export const useDeckListState = () => {
  const cards = useStudyCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const preferences = usePreferences();
  const { bootstrapStatus } = useStore(deckListStore);

  const sections = useDeadlineQuery(buildDeckListSections, [
    { decks, cards, sessionsByDeckId, enabled: preferences.study.useCardInterval },
  ]);

  const rawCount = decks.length;
  const visibleCount = sections.studying.length + sections.reviewNow.length + sections.other.length;
  const emptyReason = deriveDeckListEmptyReason({
    rawCount,
    loadSample: preferences.loadSample,
    bootstrapStatus,
  });

  return {
    ...sections,
    rawCount,
    visibleCount,
    emptyReason,
  };
};
