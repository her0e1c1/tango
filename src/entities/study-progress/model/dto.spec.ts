import { describe, expect, it } from "vitest";

import { mapStudyProgressDocument } from "./dto";
import type { StudyProgressDocumentFields } from "./types";

describe("StudyProgress document mapping [CARD-01]", () => {
  it("depends only on the physical document fields owned by StudyProgress", () => {
    const document: StudyProgressDocumentFields = {
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    };

    expect(mapStudyProgressDocument("card-a", document)).toEqual({
      cardId: "card-a",
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });
  });

  it.each([
    [4, 1],
    [1, 4],
    [0, 5],
    [-1, 6],
    [-5, 10],
  ])("adapts legacy score %s to difficulty %s", (score, difficulty) => {
    expect(mapStudyProgressDocument("card-a", { score, numberOfSeen: 0 }).difficulty).toBe(difficulty);
  });

  it("uses difficulty when a physical legacy score is also present", () => {
    expect(mapStudyProgressDocument("card-a", { difficulty: 7.5, score: 99, numberOfSeen: 0 }).difficulty).toBe(7.5);
  });
});
