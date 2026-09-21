import { describe, expect, it } from "vitest";

import { mapStudyProgressDocument } from "./dto";
import type { StudyProgressDocumentFields } from "./types";

describe("StudyProgress document mapping [CARD-VIEW-01]", () => {
  it("depends only on the physical document fields owned by StudyProgress", () => {
    const document: StudyProgressDocumentFields = {
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
    };

    expect(mapStudyProgressDocument("card-a", document)).toEqual({
      cardId: "card-a",
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
    });
  });
});
