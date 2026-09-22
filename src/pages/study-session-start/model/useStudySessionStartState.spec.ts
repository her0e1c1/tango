import "@/test/mockFirestorePersistence";
import { seedCardStudyState } from "@/test/studyStateFixtures";
import { clearCardStudyStates } from "@/entities/card-study-state";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { startStudy } from "@/test/entityFixtures";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { useStudySessionStartState } from "./queries/useStudySessionStartState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const preferences = createPreferences({
  study: { maxNumberOfCardsToLearn: 12, shuffled: false, useCardInterval: true },
});
const deck = createLocalDeck({
  id: "study-start-deck",
  name: "Japanese vocabulary",
  selectedTags: ["eligible"],
});
const filter = {
  selectedTags: deck.selectedTags,
  tagAndFilter: deck.tagAndFilter,
};
const eligibleCard = createLocalCard({
  id: "eligible-card",
  deckId: deck.id,
  tags: ["eligible"],
  uniqueKey: "eligible-card",
});
const laterCard = createLocalCard({
  id: "later-card",
  deckId: deck.id,
  tags: ["later"],
  uniqueKey: "later-card",
});
const futureCard = createLocalCard({
  id: "future-card",
  deckId: deck.id,
  tags: ["eligible"],
  uniqueKey: "future-card",
});

describe("useStudySessionStartState [STUDY-SESSION-01]", () => {
  beforeEach(async () => {
    replaceAuthSession({
      displayName: null,
      isAnonymous: true,
      status: "authenticated",
      uid: "user-id",
    });
    clearCardStudyStates();
    seedCardStudyState(futureCard.id, 253_402_300_799_999, "user-id", deck.id);
    clearStudySessions();
    updatePreferences(preferences);
    await createDeck("user-id", deck);
    await mutateCards("user-id", [
      { kind: "create", card: eligibleCard },
      { kind: "create", card: laterCard },
      { kind: "create", card: futureCard },
    ]);
  });

  afterEach(async () => {
    await deleteDeck("user-id", deck.id);
    clearStudySessions();
  });

  it("starts the stored Deck with its eligible Cards and Study preferences", () => {
    const { result } = renderHook(() => useStudySessionStartState(deck.id, filter));

    expect(result.current).toMatchObject({
      maxNumberOfCardsToLearn: 12,
      cardsLength: 1,
      tags: ["eligible", "later"],
    });

    act(() => {
      startStudy(deck.id, result.current.cards, result.current.studyPreferences, deck.uid);
    });

    expect(getStudySession(deck.id)).toMatchObject({
      deckId: deck.id,
      cardOrderIds: [eligibleCard.id],
      currentIndex: 0,
    });
  });

  it("starts with Cards matching the Page-composed filter", () => {
    const { result } = renderHook(() => useStudySessionStartState(deck.id, { ...filter, selectedTags: ["later"] }));

    expect(result.current.cardsLength).toBe(1);

    act(() => {
      startStudy(deck.id, result.current.cards, result.current.studyPreferences, deck.uid);
    });

    expect(getStudySession(deck.id)?.cardOrderIds).toEqual([laterCard.id]);
  });
});
