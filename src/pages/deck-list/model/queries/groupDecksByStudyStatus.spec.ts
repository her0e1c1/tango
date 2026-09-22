import { describe, expect, it } from "vitest";
import type { StudySession } from "@/entities/study-session";
import { createDeck } from "@/test/factories";
import { groupDecksByStudyStatus } from "./groupDecksByStudyStatus";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
  remote: { uid: "uid", startedAt: 0 },
};

describe("groupDecksByStudyStatus [STUDY-SESSION-06]", () => {
  it("groups decks by whether they have a study session", () => {
    const decks = [
      createDeck({ id: "not-studying-z", name: "Zulu" }),
      createDeck({ id: "studying-old", name: "Bravo" }),
      createDeck({ id: "not-studying-a", name: "Alpha" }),
      createDeck({ id: "studying-new", name: "Charlie" }),
    ];
    const sessions = {
      "studying-old": { ...session, deckId: "studying-old", lastStudiedAt: 100 },
      "studying-new": { ...session, deckId: "studying-new", lastStudiedAt: 200 },
    };

    const groups = groupDecksByStudyStatus(decks, sessions);

    expect(groups.active.map(({ deck }) => deck.id)).toEqual(["studying-old", "studying-new"]);
    expect(groups.inactive.map((deck) => deck.id)).toEqual(["not-studying-z", "not-studying-a"]);
  });
});
