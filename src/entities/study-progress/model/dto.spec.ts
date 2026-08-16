import { describe, expect, it } from "vitest";

import { mapStudyProgressDocument } from "./dto";
import type { StudyProgressDocumentFields } from "./types";

describe("StudyProgress document mapping", () => {
  it("depends only on the physical document fields owned by StudyProgress", () => {
    const document: StudyProgressDocumentFields = {
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    };

    expect(mapStudyProgressDocument("card-a", document)).toEqual({
      cardId: "card-a",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });
  });
});
