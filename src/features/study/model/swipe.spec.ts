import type { StudyProgress } from "@/entities/study-progress";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { buildStudyPatch } from "./swipe";

describe("buildStudyPatch", () => {
  const now = new Date(1999, 10, 1).getTime();
  const progress: StudyProgress = { cardId: "c1", score: 0, numberOfSeen: 2 };

  it("builds a patch with incremented numberOfSeen and computed score", () => {
    const patch = buildStudyPatch(progress, "GoToNextCardMastered", now);
    expect(patch).toEqual({
      cardId: "c1",
      score: 1,
      numberOfSeen: 3,
      lastSeenAt: now,
    });
  });

  it("preserves score for navigation-only actions", () => {
    const patch = buildStudyPatch(progress, "GoToNextCard", now);
    expect(patch.score).toBe(0);
    expect(patch.numberOfSeen).toBe(3);
  });

  it.each(["GoToNextCardNotMastered", "GoToNextCardToggleMastered"] as const)(
    "records %s as not mastered",
    (action) => {
      expect(buildStudyPatch(progress, action, now)).toMatchObject({ score: -1 });
    }
  );
});
