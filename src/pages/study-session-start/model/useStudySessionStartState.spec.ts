import "@/test/mockFirestorePersistence";
import { seedCardFsrs } from "@/test/studyStateFixtures";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { createCard } from "@/entities/card";
import { createDeck, deleteDeck, getStudyFilter } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { startStudy } from "@/test/utils/entityFixtures";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { useStudySessionStartState } from "./queries/useStudySessionStartState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const preferences = createPreferences({
  study: { maxNumberOfCardsToLearn: 12, shuffled: false, useCardInterval: true },
});
const deck = createLocalDeck({
  id: "study-start-deck",
  name: "Japanese vocabulary",
  studyFilter: { selectedTags: ["eligible"], tagAndFilter: false },
});
const filter = getStudyFilter(deck);
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
    // Given: Establish the shared setup used by the following cases.
    replaceAuthSession({
      displayName: null,
      isAnonymous: true,
      status: "authenticated",
      uid: "user-id",
    });
    clearStudySessions();
    updatePreferences(preferences);
    await createDeck("user-id", deck);
    await createCard("user-id", eligibleCard);
    await createCard("user-id", laterCard);
    await createCard("user-id", futureCard);
    seedCardFsrs(futureCard.id, 253_402_300_799_999);
  });

  afterEach(async () => {
    await deleteDeck("user-id", deck.id);
    clearStudySessions();
  });

  it("starts the stored Deck with its eligible Cards and Study preferences", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(() => useStudySessionStartState(deck.id, filter));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toMatchObject({
      maxNumberOfCardsToLearn: 12,
      cardsLength: 1,
      tags: ["eligible", "later"],
    });

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      startStudy(deck.id, result.current.cards, result.current.studyPreferences, deck.uid);
    });

    // Then: Verify the expected result in the assertions below.
    expect(getStudySession(deck.id)).toMatchObject({
      deckId: deck.id,
      cardOrderIds: [eligibleCard.id],
      currentIndex: 0,
    });
  });

  it("starts with Cards matching the Page-composed filter", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(() => useStudySessionStartState(deck.id, { ...filter, selectedTags: ["later"] }));

    // Then: Verify the expected result in the assertions below.
    expect(result.current.cardsLength).toBe(1);

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      startStudy(deck.id, result.current.cards, result.current.studyPreferences, deck.uid);
    });

    // Then: Verify the expected result in the assertions below.
    expect(getStudySession(deck.id)?.cardOrderIds).toEqual([laterCard.id]);
  });
});
