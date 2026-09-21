import { describe, expect, it } from "vitest";

import { recordCardStudyProgress } from "./rules";
import type { CardProgressFields } from "./types";

// Builds the Card fields required by StudyProgress ordering rules.
const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  difficulty: 5,
  numberOfSeen,
});

describe("recordCardStudyProgress [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it("records study history without changing the relative difficulty", () => {
    expect(recordCardStudyProgress(cardProgress("card-id", 2), 1_786_512_000_000)).toEqual({
      cardId: "card-id",
      difficulty: 5,
      numberOfSeen: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });
});
