import type { Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { classifyStudySchedule } from "@/entities/study-schedule";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  selectStudyCardsWithDeadline,
  type StudySession,
} from "@/entities/study-session";

function getDeckReview(cards: Card[], deck: Deck, now: number) {
  const selection = selectStudyCardsWithDeadline(cards, deck, true, now);
  let dueCardCount = 0;
  let newCardCount = 0;
  let firstDueAt: number | undefined;
  for (const card of selection.cards) {
    const timing = classifyStudySchedule(card, now);
    if (timing.status === "new") newCardCount += 1;
    if (timing.status === "due") {
      dueCardCount += 1;
      firstDueAt = Math.min(firstDueAt ?? timing.dueAt, timing.dueAt);
    }
  }
  return { dueCardCount, newCardCount, firstDueAt, nextDueAt: selection.nextDueAt };
}

interface DeckListInputs {
  decks: Deck[];
  cards: Card[];
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
  useCardInterval: boolean;
}

export function buildDeckListSections(
  { decks, cards, sessionsByDeckId, useCardInterval }: DeckListInputs,
  now: number
) {
  const cardsByDeckId = new Map<DeckId, Card[]>();
  for (const card of cards) {
    const group = cardsByDeckId.get(card.deckId);
    if (group === undefined) cardsByDeckId.set(card.deckId, [card]);
    else group.push(card);
  }
  const toItem = (deck: Deck) => {
    const deckCards = cardsByDeckId.get(deck.id) ?? [];
    return {
      deck,
      cardCount: deckCards.length,
      review: useCardInterval ? getDeckReview(deckCards, deck, now) : undefined,
    };
  };
  const { active, inactive } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  const studying = active.sort(compareActiveDecks).map(({ deck, session }) => ({
    ...toItem(deck),
    studySession: session,
  }));
  const reviewNow: ReturnType<typeof toItem>[] = [];
  const other: ReturnType<typeof toItem>[] = [];
  for (const deck of inactive) {
    const item = toItem(deck);
    if (item.review !== undefined && item.review.dueCardCount + item.review.newCardCount > 0) reviewNow.push(item);
    else other.push(item);
  }
  reviewNow.sort(
    (left, right) =>
      (left.review?.firstDueAt ?? Infinity) - (right.review?.firstDueAt ?? Infinity) ||
      left.deck.name.localeCompare(right.deck.name)
  );
  other.sort((left, right) => left.deck.name.localeCompare(right.deck.name));
  let dueCardCount = 0;
  let newCardCount = 0;
  let nextDueAt: number | undefined;
  // Include studying Decks once, without replacing their frozen session order or cursor.
  for (const item of [...studying, ...reviewNow, ...other]) {
    if (item.review === undefined) continue;
    dueCardCount += item.review.dueCardCount;
    newCardCount += item.review.newCardCount;
    const next = item.review.nextDueAt;
    if (next !== undefined) nextDueAt = Math.min(nextDueAt ?? next, next);
  }
  return {
    studying,
    reviewNow,
    other,
    reviewSummary: useCardInterval ? { dueCardCount, newCardCount } : undefined,
    nextDueAt,
  };
}
