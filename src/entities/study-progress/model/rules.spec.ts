import { describe, expect, it } from "vitest";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import {
  createStudyProgressFromCard,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
  recordCardStudyProgress,
} from "./rules";
import type { CardProgressFields, StudyProgress, StudyProgressEdit } from "./types";

const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  score: 0,
  numberOfSeen,
});

describe("createStudyProgressFromCard", () => {
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

  it("restores progress from a Card without copying Card content", () => {
    const card = {
      id: "card-id",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
      frontText: "not part of progress",
    };
    const progress = createStudyProgressFromCard(card);

    expect(progress).toEqual({
      cardId: "card-id",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
    });
    expect(progress).not.toHaveProperty("frontText");
  });
});

describe("recordCardStudyProgress", () => {
  it.each<[number, SwipeAction, number]>([
    [0, "GoToNextCardMastered", 1],
    [3, "GoToNextCardMastered", 4],
    [-1, "GoToNextCardMastered", 0],
    [0, "GoToNextCardNotMastered", -1],
    [-2, "GoToNextCardToggleMastered", -3],
    [2, "GoToNextCardNotMastered", 0],
    [3, "GoToNextCard", 3],
    [3, "GoToPrevCard", 3],
  ])("records score %i for %s as %i", (score, swipeAction, expectedScore) => {
    const card = { ...cardProgress("card-id", 2), score };

    expect(recordCardStudyProgress(card, swipeAction, 1_786_512_000_000)).toEqual({
      cardId: "card-id",
      score: expectedScore,
      numberOfSeen: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });
});

describe("study progress selection", () => {
  const filter = {
    minimumScore: -1,
    maximumScore: 2,
    respectNextSeeingAt: true,
  };

  it("applies score bounds and the next seeing time", () => {
    expect(isStudyProgressEligible({ ...initialStudyProgress("eligible"), score: 2 }, filter, 1000)).toBe(true);
    expect(isStudyProgressEligible({ ...initialStudyProgress("high"), score: 3 }, filter, 1000)).toBe(false);
    expect(isStudyProgressEligible({ ...initialStudyProgress("low"), score: -2 }, filter, 1000)).toBe(false);
    expect(
      isStudyProgressEligible({ ...initialStudyProgress("future"), nextSeeingAt: new Date(1001) }, filter, 1000)
    ).toBe(false);
  });

  it("finds the nearest future seeing time", () => {
    const progresses = [
      { ...initialStudyProgress("past"), nextSeeingAt: new Date(900) },
      { ...initialStudyProgress("later"), nextSeeingAt: new Date(2000) },
      { ...initialStudyProgress("next"), nextSeeingAt: new Date(1500) },
    ];

    expect(getNextStudyAvailabilityAt(progresses, 1000)).toBe(1500);
  });
});
