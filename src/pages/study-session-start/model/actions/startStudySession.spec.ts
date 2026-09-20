import { beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck, createLocalDeck, createPreferences } from "@/test/factories";
import { startStudySession } from "./startStudySession";

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
  createStudySession: vi.fn(() => Promise.resolve()),
  updateStudySession: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("Study start persistence mode [SWIPE-06] [SWIPE-17] [PERSIST-04]", () => {
  beforeEach(() => {
    clearStudySessions();
    mocks.deck = createDeck({ id: "deck" });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
  });

  it.each([
    { label: "signed-in remote Deck", isAnonymous: false, deck: createDeck({ id: "deck" }), remote: true },
    { label: "signed-in local Deck", isAnonymous: false, deck: createLocalDeck({ id: "deck" }), remote: false },
    {
      label: "anonymous public Deck",
      isAnonymous: true,
      deck: createDeck({ id: "deck", isPublic: true }),
      remote: false,
    },
  ])("starts a $label with the appropriate persistence mode", ({ isAnonymous, deck, remote }) => {
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous, displayName: null });
    mocks.deck = deck;
    startStudySession(deck.id, deck);
    expect(getStudySession(deck.id)).toMatchObject({ cardOrderIds: ["card"], currentIndex: 0 });
    expect(getStudySession(deck.id)?.remote?.uid).toBe(remote ? "uid" : undefined);
  });
  it("uses the current account after an identity switch before Start", () => {
    const deck = createDeck({ id: "deck" });
    const start = () => startStudySession(deck.id, deck);
    replaceAuthSession({ status: "authenticated", uid: "current", isAnonymous: false, displayName: null });
    expect(start()).toBe(true);
    expect(getStudySession("deck")?.remote?.uid).toBe("current");
    replaceAuthSession({ status: "unauthenticated" });
    expect(start()).toBe(true);
    expect(getStudySession("deck")?.remote).toBeUndefined();
  });
});
