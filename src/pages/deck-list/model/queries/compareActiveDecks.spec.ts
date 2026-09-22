import { describe, expect, it } from "vitest";
import type { StudySession } from "@/entities/study-session";
import { compareActiveDecks } from "./compareActiveDecks";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
  remote: { uid: "uid", startedAt: 0 },
};

describe("compareActiveDecks [STUDY-SESSION-06]", () => {
  it("orders recent sessions first and uses deck name as the tie breaker", () => {
    const activeDecks = [
      { deck: { name: "Bravo" }, session: { ...session, lastStudiedAt: 100 } },
      { deck: { name: "Charlie" }, session: { ...session, lastStudiedAt: 200 } },
      { deck: { name: "Alpha" }, session: { ...session, lastStudiedAt: 200 } },
    ];

    expect(activeDecks.sort(compareActiveDecks).map(({ deck }) => deck.name)).toEqual(["Alpha", "Charlie", "Bravo"]);
  });
});
