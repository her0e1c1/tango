import { beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { startStudySession } from "./startStudySession";
import { restoreStudySession } from "@/test/entityFixtures";

const mocks = vi.hoisted(() => ({ deck: null as Deck | null }));

vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  getDecks: () => (mocks.deck === null ? [] : [mocks.deck]),
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  getCards: () => [createCard({ id: "card", deckId: "deck" })],
}));
vi.mock("@/entities/preference", () => ({
  getPreferences: () => createPreferences({ study: { shuffled: false, maxNumberOfCardsToLearn: 0 } }),
}));

vi.mock("@/entities/study-session/api/firestore", () => ({
  createStudySession: async (session: import("@/entities/study-session").StudySession) => {
    await Promise.resolve();
    restoreStudySession(session);
  },
  updateStudySession: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("Study start persistence mode [SWIPE-06] [SWIPE-17] [PERSIST-04]", () => {
  beforeEach(() => {
    clearStudySessions();
    mocks.deck = createDeck({ id: "deck", uid: "uid" });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
  });

  it.each([true, false])("uses the same persistence path for anonymous=%s", async (isAnonymous) => {
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous, displayName: null });
    const deck = createDeck({ id: "deck", uid: "uid" });
    mocks.deck = deck;
    expect(await startStudySession(deck.id, deck)).toBe(true);
    expect(getStudySession(deck.id)).toMatchObject({ cardOrderIds: ["card"], currentIndex: 0, remote: { uid: "uid" } });
  });
  it("rejects a different account after an identity switch before Start", async () => {
    const deck = createDeck({ id: "deck", uid: "uid" });
    replaceAuthSession({ status: "authenticated", uid: "current", isAnonymous: false, displayName: null });
    expect(await startStudySession(deck.id, deck)).toBe(false);
    expect(getStudySession("deck")).toBeUndefined();
  });
});
