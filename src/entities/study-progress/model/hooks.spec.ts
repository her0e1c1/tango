import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createStudyProgress } from "./defaults";
import { useStudyProgress, useStudyProgresses } from "./hooks";
import { clearRemoteStudyProgresses, replaceRemoteStudyProgresses, studyProgressStore } from "./store";

describe("StudyProgress hooks", () => {
  beforeEach(() => {
    studyProgressStore.setState({ remoteProgresses: [], localProgresses: [] });
  });

  it("reads separated remote and local progress", () => {
    const remote = createStudyProgress("remote");
    const local = createStudyProgress("local");
    studyProgressStore.setState({ localProgresses: [local] });

    replaceRemoteStudyProgresses([remote]);

    expect(renderHook(useStudyProgresses).result.current).toEqual([remote, local]);
    expect(renderHook(() => useStudyProgress("remote")).result.current).toEqual(remote);
    expect(renderHook(() => useStudyProgress("local")).result.current).toEqual(local);

    clearRemoteStudyProgresses();
    expect(renderHook(useStudyProgresses).result.current).toEqual([local]);
  });
});
