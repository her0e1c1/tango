import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createPreferences, createStudyProgress } from "@/test/factories";
import { clearStudySessions, getStudySession, startStudy } from "./store";

describe("startStudy", () => {
  beforeEach(() => {
    clearStudySessions();
    localStorage.clear();
  });

  it("starts at index zero with the configured card order", () => {
    const progresses = [
      createStudyProgress({ cardId: "first", numberOfSeen: 3 }),
      createStudyProgress({ cardId: "second", numberOfSeen: 2 }),
      createStudyProgress({ cardId: "third", numberOfSeen: 1 }),
    ];
    const { study } = createPreferences({ shuffled: false, maxNumberOfCardsToLearn: 2 });

    startStudy("deck", progresses, study);

    expect(getStudySession("deck")?.currentIndex).toBe(0);
    expect(getStudySession("deck")?.cardOrderIds).toEqual(["third", "second"]);
  });

  it("copies the card order into the session", () => {
    const progresses = [createStudyProgress({ cardId: "first" }), createStudyProgress({ cardId: "second" })];
    const { study } = createPreferences({ shuffled: false, maxNumberOfCardsToLearn: 2 });

    startStudy("deck", progresses, study);
    progresses.reverse();

    expect(getStudySession("deck")?.cardOrderIds).toEqual(["first", "second"]);
  });
});
