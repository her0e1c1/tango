import { beforeEach, describe, expect, it, vi } from "vitest";

import { STUDY_STORAGE_KEY, studyStore } from "../state/studyStore";
import { createStudyIdentityCleanup } from "./studyIdentityCleanup";

describe("createStudyIdentityCleanup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    studyStore.setState({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  it("clears persisted sessions and transient UI state without removing unrelated storage", async () => {
    localStorage.setItem("unrelated-preference", "preserve-me");
    studyStore.getState().startStudy("deck", ["card"]);
    studyStore.setState({
      showBackText: true,
      autoPlay: true,
      lastSwipe: { direction: "cardSwipeLeft", eventId: 1 },
    });

    await createStudyIdentityCleanup()();

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated-preference")).toBe("preserve-me");
  });

  it("returns a storage cleanup failure to the caller and completes on retry", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    const cleanupError = new Error("storage cleanup failed");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw cleanupError;
    });
    const cleanup = createStudyIdentityCleanup();

    await expect(cleanup()).rejects.toBe(cleanupError);
    expect(studyStore.getState().sessionsByDeckId).toEqual({});

    await expect(cleanup()).resolves.toBeUndefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("does not remove study state created after a failed cleanup", async () => {
    studyStore.getState().startStudy("old-deck", ["old-card"]);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw new Error("storage cleanup failed");
    });
    const cleanup = createStudyIdentityCleanup();
    await expect(cleanup()).rejects.toThrow("storage cleanup failed");

    studyStore.getState().startStudy("new-deck", ["new-card"]);
    const persistedNewState = localStorage.getItem(STUDY_STORAGE_KEY);

    await cleanup();

    expect(studyStore.getState().sessionsByDeckId).toEqual({
      "new-deck": expect.objectContaining({ deckId: "new-deck", cardOrderIds: ["new-card"] }),
    });
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(persistedNewState);
  });
});
