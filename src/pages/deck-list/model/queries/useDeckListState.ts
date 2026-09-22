import { type Card, useCards } from "@/entities/card";
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { classifyStudySchedule } from "@/entities/study-schedule";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  selectStudyCardsWithDeadline,
  type StudySession,
  useStudySessions,
} from "@/entities/study-session";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

function summarizeDeck(cards: Card[], deck: Deck, now: number) {
  const selected = selectStudyCardsWithDeadline(cards, deck, true, now);
  let due = 0;
  let newCount = 0;
  let earliestDueAt: number | undefined;
  for (const card of selected.cards) {
    const timing = classifyStudySchedule(card, now);
    if (timing.status === "new") newCount += 1;
    else if (timing.status === "due") {
      due += 1;
      earliestDueAt = Math.min(earliestDueAt ?? timing.dueAt, timing.dueAt);
    }
  }
  return { due, new: newCount, earliestDueAt, nextDueAt: selected.nextDueAt };
}

function buildDeckListSections(
  {
    decks,
    cards,
    sessionsByDeckId,
    enabled,
  }: {
    decks: Deck[];
    cards: Card[];
    sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
    enabled: boolean;
  },
  now: number
) {
  const cardsByDeck = new Map<DeckId, Card[]>();
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
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const preferences = usePreferences();
  return useDeadlineQuery(buildDeckListSections, [
    { decks, cards, sessionsByDeckId, enabled: preferences.study.useCardInterval },
  ]);
};
