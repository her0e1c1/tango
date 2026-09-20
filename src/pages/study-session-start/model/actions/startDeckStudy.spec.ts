import { beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { createCard, createDeck, createLocalDeck } from "@/test/factories";
import { startDeckStudy } from "./startDeckStudy";

vi.mock("@/entities/study-session/api/firestore", () => ({
  createStudySession: vi.fn(() => Promise.resolve()),
  updateStudySession: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("Study start persistence mode [SWIPE-06] [SWIPE-17] [PERSIST-04]", () => {
  beforeEach(() => {
    clearStudySessions();
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
    startDeckStudy(deck, [createCard({ id: "card", deckId: deck.id })], {
      shuffled: false,
      maxNumberOfCardsToLearn: 0,
    });
    expect(getStudySession(deck.id)).toMatchObject({ cardOrderIds: ["card"], currentIndex: 0 });
    expect(getStudySession(deck.id)?.remote?.uid).toBe(remote ? "uid" : undefined);
  });
  it("uses the current account after an identity switch before Start", () => {
    const start = () =>
      startDeckStudy(createDeck({ id: "deck" }), [createCard({ id: "card" })], {
        shuffled: false,
        maxNumberOfCardsToLearn: 0,
      });
    replaceAuthSession({ status: "authenticated", uid: "current", isAnonymous: false, displayName: null });
    expect(start()).toBe(true);
    expect(getStudySession("deck")?.remote?.uid).toBe("current");
    replaceAuthSession({ status: "unauthenticated" });
    expect(start()).toBe(true);
    expect(getStudySession("deck")?.remote).toBeUndefined();
  });
});
