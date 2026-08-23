import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { clearStudySessions, startStudy } from "@/entities/study-session";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

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

describe("useDeckListState", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    replaceAuthSession({ status: "initializing" });
    clearStudySessions();
    await Promise.all(decks.map((deck) => createDeck("", deck)));
    await mutateCards(
      "",
      cards.map((card) => ({ kind: "create" as const, card }))
    );

    vi.setSystemTime(100);
    startStudy("active-old", cardsForDeck("active-old"), studyPreferences);
    vi.setSystemTime(200);
    startStudy("active-new", cardsForDeck("active-new"), studyPreferences);
  });

  afterEach(async () => {
    clearStudySessions();
    await Promise.all(decks.map((deck) => deleteDeck("", deck.id)));
    vi.useRealTimers();
  });

  it("puts active Decks in recent order and inactive Decks in name order", () => {
    const { result } = renderHook(() => useDeckListState());
    const { sections } = result.current;

    expect(sections.studying.map((item) => item.deck.id)).toEqual(["active-new", "active-old"]);
    expect(sections.studying[0]?.studySession).toMatchObject({
      deckId: "active-new",
      currentIndex: 0,
      cardOrderIds: cardsForDeck("active-new").map((card) => card.id),
      lastStudiedAt: 200,
    });
    expect(sections.other.map((item) => item.deck.id)).toEqual(["other-a", "other-z"]);
    expect(sections.other.map((item) => item.cardCount)).toEqual([1, 2]);
  });
});
