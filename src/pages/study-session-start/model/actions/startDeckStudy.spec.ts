import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { createCard, createDeck, createLocalDeck } from "@/test/factories";
import { startDeckStudy } from "./startDeckStudy";

const mocks = vi.hoisted(() => ({ syncStatus: "ready" as "idle" | "loading" | "ready" | "error" }));
vi.mock("@/entities/study-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-session")>()),
  getStudySessionSyncStatus: () => mocks.syncStatus,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("Study start persistence mode [SWIPE-06] [SWIPE-17] [PERSIST-04]", () => {
  beforeEach(() => {
    clearStudySessions();
    mocks.syncStatus = "ready";
  });

  it.each(["idle", "loading", "error"] as const)(
    "does not replace an unknown cloud session while synchronization is %s",
    (status) => {
      mocks.syncStatus = status;
      const deck = createDeck({ id: "deck" });
      expect(
        startDeckStudy({ uid: "uid", isAnonymous: false }, deck, [createCard({ id: "card" })], {
          shuffled: false,
          maxNumberOfCardsToLearn: 0,
        })
      ).toBe(false);
      expect(getStudySession(deck.id)).toBeUndefined();
    }
  );

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
    startDeckStudy({ uid: "uid", isAnonymous }, deck, [createCard({ id: "card", deckId: deck.id })], {
      shuffled: false,
      maxNumberOfCardsToLearn: 0,
    });
    expect(getStudySession(deck.id)).toMatchObject({ cardOrderIds: ["card"], currentIndex: 0 });
    expect(getStudySession(deck.id)?.remote?.uid).toBe(remote ? "uid" : undefined);
  });
});
