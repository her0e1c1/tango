import { describe, expect, it } from "vitest";

import { calculateDifficulty, recordCardStudyProgress } from "./rules";
import type { CardProgressFields, StudyRating } from "./types";

// Builds the Card fields required by StudyProgress ordering rules.
const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  difficulty: 5,
  numberOfSeen,
});

describe("recordCardStudyProgress [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it.each<[number, StudyRating | undefined, number]>([
    [5, "good", 4],
    [7, "good", 6],
    [1, "good", 1],
    [5, "again", 6],
    [8, "hard", 7],
    [8, "easy", 7],
    [3, "again", 4],
    [10, "again", 10],
    [3, undefined, 3],
  ])("records difficulty %i for %s as %i", (difficulty, swipeAction, expectedDifficulty) => {
    const card = { ...cardProgress("card-id", 2), difficulty };

    expect(recordCardStudyProgress(card, swipeAction, 1_786_512_000_000)).toMatchObject({
      cardId: "card-id",
      difficulty: expectedDifficulty,
      numberOfSeen: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });

  it("does not reset difficulty when the rating direction changes", () => {
    expect(calculateDifficulty(8, "good")).toBe(7);
    expect(calculateDifficulty(3, "again")).toBe(4);
  });
});

describe("calculateDifficulty [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03]", () => {
  it.each<[number, StudyRating | undefined, number]>([
    [5, "good", 4],
    [5, "again", 6],
    [5, undefined, 5],
    [5, "hard", 4],
    [5, "easy", 4],
    [1, "good", 1],
    [1, "hard", 1],
    [1, "easy", 1],
    [10, "again", 10],
  ])("adjusts difficulty %i for %s to %i", (difficulty, rating, expectedDifficulty) => {
    expect(calculateDifficulty(difficulty, rating)).toBe(expectedDifficulty);
  });
});
