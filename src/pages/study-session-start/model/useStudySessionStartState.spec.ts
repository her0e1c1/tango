import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { useStudySessionStartState } from "./useStudySessionStartState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const preferences = createPreferences({
  study: { maxNumberOfCardsToLearn: 12, shuffled: false, useCardInterval: true },
});
const deck = createLocalDeck({
  id: "study-start-deck",
  name: "Japanese vocabulary",
  difficultyMax: 6,
  difficultyMin: 4,
  selectedTags: ["eligible"],
});
const eligibleCard = createLocalCard({
  id: "eligible-card",
  deckId: deck.id,
  difficulty: 4,
  tags: ["eligible"],
  uniqueKey: "eligible-card",
});
const laterCard = createLocalCard({
  id: "later-card",
  deckId: deck.id,
  tags: ["later"],
  uniqueKey: "later-card",
});
const highDifficultyCard = createLocalCard({
  id: "high-difficulty-card",
  deckId: deck.id,
  difficulty: 7,
  tags: ["eligible"],
  uniqueKey: "high-difficulty-card",
});
const futureCard = createLocalCard({
  id: "future-card",
  deckId: deck.id,
  nextSeeingAt: new Date(253_402_300_799_999),
  tags: ["eligible"],
  uniqueKey: "future-card",
});

describe("useStudySessionStartState [SWIPE-06]", () => {
  beforeEach(async () => {
    replaceAuthSession({
      displayName: null,
      isAnonymous: true,
      status: "authenticated",
      uid: "local-user",
    });
    clearStudySessions();
    updatePreferences(preferences);
    await createDeck("", deck);
    await mutateCards("", [
      { kind: "create", card: eligibleCard },
      { kind: "create", card: laterCard },
      { kind: "create", card: highDifficultyCard },
      { kind: "create", card: futureCard },
    ]);
  });

  afterEach(async () => {
    await deleteDeck("", deck.id);
    clearStudySessions();
  });

  it("starts the stored Deck with its eligible Cards and Study preferences", () => {
    const { result } = renderHook(() => useStudySessionStartState(deck));

    expect(result.current).toMatchObject({
      deckName: "Japanese vocabulary",
      maxNumberOfCardsToLearn: 12,
      cardsLength: 1,
      tags: ["eligible", "later"],
    });

    act(() => {
      result.current.onStart();
    });

    expect(getStudySession(deck.id)).toMatchObject({
      deckId: deck.id,
      cardOrderIds: [eligibleCard.id],
      currentIndex: 0,
    });
  });

  it("starts with Cards matching the Page-composed filter", () => {
    const { result } = renderHook(() => useStudySessionStartState({ ...deck, selectedTags: ["later"] }));

    expect(result.current.cardsLength).toBe(1);

    act(() => {
      result.current.onStart();
    });

    expect(getStudySession(deck.id)?.cardOrderIds).toEqual([laterCard.id]);
  });
});
