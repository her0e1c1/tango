import { calculateFsrsState } from "@/entities/card";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { startStudySession } from "./startStudySession";
import { restoreStudySession } from "@/test/entityFixtures";

const mocks = vi.hoisted(() => ({ deck: null as Deck | null, cards: null as Card[] | null, useCardInterval: false }));

vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  getDecks: () => (mocks.deck === null ? [] : [mocks.deck]),
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  getCards: () => mocks.cards ?? [createCard({ id: "card", deckId: "deck" })],
}));
vi.mock("@/entities/preference", () => ({
  getPreferences: () =>
    createPreferences({
      study: { shuffled: false, maxNumberOfCardsToLearn: 0, useCardInterval: mocks.useCardInterval },
    }),
}));

vi.mock("@/entities/study-session/api/firestore", () => ({
  startStudy: ({
    deckId,
    cardOrderIds,
    uid,
    now = Date.now(),
  }: {
    deckId: string;
    cardOrderIds: string[];
    uid: string;
    now?: number;
  }) => {
    const sessionId = crypto.randomUUID();
    restoreStudySession({
      sessionId,
      deckId,
      cardOrderIds,
      currentIndex: 0,
      lastStudiedAt: now,
      remote: { uid, startedAt: now },
    });
    return sessionId;
  },
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("Study start persistence mode [STUDY-SESSION-01] [STUDY-SESSION-07] [PERSISTENCE-04]", () => {
  beforeEach(() => {
    clearStudySessions();
    mocks.cards = null;
    mocks.useCardInterval = false;
    mocks.deck = createDeck({ id: "deck", uid: "uid" });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
  });

  it.each([true, false])("uses the same persistence path for anonymous=%s", async (isAnonymous) => {
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous, displayName: null });
    const deck = createDeck({ id: "deck", uid: "uid" });
    mocks.deck = deck;
    expect(await startStudySession(deck.id, deck)).toEqual(expect.any(String));
    expect(getStudySession(deck.id)).toMatchObject({ cardOrderIds: ["card"], currentIndex: 0, remote: { uid: "uid" } });
  });
  it("rejects a different account after an identity switch before Start", async () => {
    const deck = createDeck({ id: "deck", uid: "uid" });
    replaceAuthSession({ status: "authenticated", uid: "current", isAnonymous: false, displayName: null });
    expect(await startStudySession(deck.id, deck)).toBeUndefined();
    expect(getStudySession("deck")).toBeUndefined();
  });
  afterEach(() => vi.useRealTimers());
  it("reselects at click time and refuses an empty selection [STUDY-SESSION-02]", async () => {
    vi.useFakeTimers();
    const now = Date.parse("2026-09-21T00:00:00Z");
    vi.setSystemTime(now);
    mocks.useCardInterval = true;
    mocks.cards = [
      createCard({
        id: "future",
        deckId: "deck",
        uid: "uid",
        fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 1000 },
      }),
    ];
    const deck = createDeck({ id: "deck", uid: "uid" });
    expect(await startStudySession(deck.id, deck)).toBeUndefined();
    expect(getStudySession(deck.id)).toBeUndefined();
    vi.setSystemTime(now + 1000);
    expect(await startStudySession(deck.id, deck)).toEqual(expect.any(String));
    expect(getStudySession(deck.id)?.cardOrderIds).toEqual(["future"]);
  });
});
