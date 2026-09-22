import "@/test/mockFirestorePersistence";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { clearStudySessions } from "@/entities/study-session";
import { startStudy } from "@/test/entityFixtures";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { deckListStore } from "../store";
import { useDeckListState } from "./useDeckListState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const decks = [
  createLocalDeck({ id: "other-z", name: "Zulu" }),
  createLocalDeck({ id: "active-old", name: "Bravo" }),
  createLocalDeck({ id: "other-a", name: "Alpha" }),
  createLocalDeck({ id: "active-new", name: "Charlie" }),
];
const cards = [
  createLocalCard({ id: "other-z-1", deckId: "other-z", uniqueKey: "other-z-1" }),
  createLocalCard({ id: "other-z-2", deckId: "other-z", uniqueKey: "other-z-2" }),
  createLocalCard({ id: "other-a-1", deckId: "other-a", uniqueKey: "other-a-1" }),
  createLocalCard({ id: "old-1", deckId: "active-old", uniqueKey: "old-1" }),
  createLocalCard({ id: "old-2", deckId: "active-old", uniqueKey: "old-2" }),
  createLocalCard({ id: "new-1", deckId: "active-new", uniqueKey: "new-1" }),
  createLocalCard({ id: "new-2", deckId: "active-new", uniqueKey: "new-2" }),
  createLocalCard({ id: "new-3", deckId: "active-new", uniqueKey: "new-3" }),
];
const studyPreferences = createPreferences({ shuffled: false, useCardInterval: false }).study;

const cardsForDeck = (deckId: string) => cards.filter((card) => card.deckId === deckId);

describe("DECK-NAVIGATION-01 STUDY-SESSION-03 useDeckListState", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    updatePreferences({ study: { useCardInterval: false } });
    replaceAuthSession({ status: "authenticated", uid: "user-id", displayName: null, isAnonymous: true });
    clearStudySessions();
    await Promise.all(decks.map((deck) => createDeck("user-id", deck)));
    await mutateCards(
      "user-id",
      cards.map((card) => ({ kind: "create" as const, card }))
    );

    vi.setSystemTime(100);
    startStudy("active-old", cardsForDeck("active-old"), studyPreferences, "user-id");
    vi.setSystemTime(200);
    startStudy("active-new", cardsForDeck("active-new"), studyPreferences, "user-id");
  });

  afterEach(async () => {
    clearStudySessions();
    await Promise.all(
      decks.map(async (deck) => {
        try {
          await deleteDeck("user-id", deck.id);
        } catch {
          // already deleted
        }
      })
    );
    vi.useRealTimers();
  });

  it("puts active Decks in recent order and inactive Decks in name order", () => {
    const { result } = renderHook(() => useDeckListState());
    const sections = result.current;

    expect(sections.studying.map((item) => item.deck.id)).toEqual(["active-new", "active-old"]);
    expect(sections.studying[0]?.studySession).toMatchObject({
      deckId: "active-new",
      currentIndex: 0,
      cardOrderIds: cardsForDeck("active-new").map((card) => card.id),
      lastStudiedAt: 200,
    });
    expect(sections.other.map((item) => item.deck.id)).toEqual(["other-a", "other-z"]);
    expect(sections.other.map((item) => item.cardCount)).toEqual([1, 2]);
    expect(sections.rawCount).toBe(4);
    expect(sections.visibleCount).toBe(4);
    expect(sections.emptyReason).toBeUndefined();
  });

  it("derives emptyReason across checking, error, confirmed-empty, and deck-present states", async () => {
    // 1. Deck-present state
    expect(renderHook(() => useDeckListState()).result.current.emptyReason).toBeUndefined();

    // Clear decks to test 0-deck scenarios
    for (const deck of decks) {
      await deleteDeck("user-id", deck.id);
    }

    // 2. Checking state (bootstrap idle or checking with loadSample true)
    act(() => {
      deckListStore.setState({ bootstrapStatus: "checking" });
    });
    expect(renderHook(() => useDeckListState()).result.current.emptyReason).toBe("checking");

    // 3. Error state
    act(() => {
      deckListStore.setState({ bootstrapStatus: "error" });
    });
    expect(renderHook(() => useDeckListState()).result.current.emptyReason).toBe("error");

    // 4. Confirmed empty state (loadSample false or bootstrap done)
    act(() => {
      updatePreferences({ loadSample: false });
      deckListStore.setState({ bootstrapStatus: "done" });
    });
    expect(renderHook(() => useDeckListState()).result.current.emptyReason).toBe("confirmed-empty");
  });
});
