import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useStudyProgress } from "./hooks";
import { clearRemoteStudyProgresses, replaceRemoteStudyProgresses } from "./store";
import type { StudyProgress } from "./types";

const progress = (cardId: string, score: number): StudyProgress => ({
  cardId,
  score,
  numberOfSeen: 1,
});

describe("StudyProgress store", () => {
  beforeEach(() => {
    clearRemoteStudyProgresses();
  });

  it("publishes the latest remote progress by card id", () => {
    const { result } = renderHook(() => useStudyProgress("card-a"));

    expect(result.current).toBeUndefined();

    act(() => {
      replaceRemoteStudyProgresses([progress("card-a", 2), progress("card-b", 3)]);
    });
    expect(result.current).toEqual(progress("card-a", 2));

    act(() => {
      replaceRemoteStudyProgresses([progress("card-b", 4)]);
    });
    expect(result.current).toBeUndefined();
  });
});
