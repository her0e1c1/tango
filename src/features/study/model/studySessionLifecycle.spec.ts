import { beforeEach, describe, expect, it, vi } from "vitest";

import { STUDY_STORAGE_KEY, studyStore } from "../state/studyStore";
import { createStudySessionTeardown } from "./studySessionLifecycle";

const resetStudyState = () => {
  studyStore.setState({
    sessionsByDeckId: {},
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined,
  });
};

describe("study session lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    resetStudyState();
  });

  it("clears persisted and transient study state without removing unrelated storage", async () => {
    localStorage.setItem("unrelated-preference", "preserve-me");
    studyStore.getState().startStudy("deck", ["card"]);
    studyStore.getState().toggleShowBackText();
    studyStore.getState().toggleAutoPlay();
    studyStore.getState().setLastSwipe("cardSwipeLeft");

    await createStudySessionTeardown()();

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated-preference")).toBe("preserve-me");
  });

  it("reports storage cleanup failures and retries unfinished persistence cleanup", async () => {
    const cleanupError = new Error("study storage cleanup failed");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw cleanupError;
    });
    studyStore.getState().startStudy("deck", ["card"]);
    const teardown = createStudySessionTeardown();

    await expect(teardown()).rejects.toBe(cleanupError);
    await expect(teardown()).resolves.toBeUndefined();

    expect(removeItem).toHaveBeenCalledTimes(2);
    expect(studyStore.getState().sessionsByDeckId).toEqual({});
  });

  it("does not erase study state created after a failed teardown", async () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw new Error("study storage cleanup failed");
    });
    studyStore.getState().startStudy("old-deck", ["old-card"]);
    const teardown = createStudySessionTeardown();
    await expect(teardown()).rejects.toThrow("study storage cleanup failed");

    studyStore.getState().startStudy("new-deck", ["new-card"]);
    await teardown();

    expect(studyStore.getState().sessionsByDeckId).toEqual({
      "new-deck": expect.objectContaining({ deckId: "new-deck", cardOrderIds: ["new-card"] }),
    });
  });
});
