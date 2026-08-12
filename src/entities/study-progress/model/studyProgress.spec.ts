import { describe, expect, it } from "vitest";

import { createStudyProgress, type StudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

describe("createStudyProgress", () => {
  it("creates study progress with the initial score and seen count", () => {
    const progress: StudyProgress = createStudyProgress("card-id");

    expect(progress).toEqual({
      cardId: "card-id",
      score: 0,
      numberOfSeen: 0,
    });
  });

  it("allows editing selected progress fields while retaining the card id", () => {
    const edit: StudyProgressEdit = {
      cardId: "card-id",
      score: 3,
      lastSeenAt: 1_786_512_000_000,
    };

    expect(edit).toEqual({
      cardId: "card-id",
      score: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });
});
