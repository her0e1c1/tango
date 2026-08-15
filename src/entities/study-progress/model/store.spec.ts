import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStudyProgress } from "./defaults";

const loadStore = () => {
  vi.resetModules();
  return import("./store");
};

describe("StudyProgress store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists local progress and restores scheduled dates", async () => {
    const { createLocalStudyProgress } = await loadStore();
    const local = { ...createStudyProgress("local"), nextSeeingAt: new Date(1000) };
    createLocalStudyProgress(local);

    expect(JSON.parse(localStorage.getItem("tango-local-study-progresses") ?? "null")).toEqual({
      state: { localProgresses: [{ ...local, nextSeeingAt: new Date(1000).toISOString() }] },
      version: 1,
    });

    const { editLocalStudyProgress } = await loadStore();
    expect(editLocalStudyProgress({ cardId: local.cardId, score: 2 })).toEqual({ ...local, score: 2 });
  });

  it("migrates released local Card progress into its dedicated store once", async () => {
    const nextSeeingAt = new Date(1000);
    const legacyCard = {
      id: "legacy-card",
      frontText: "Legacy",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 500,
      nextSeeingAt: nextSeeingAt.toISOString(),
      interval: 2,
    };
    localStorage.setItem("tango-local-cards", JSON.stringify({ state: { localCards: [legacyCard] }, version: 1 }));
    const { editLocalStudyProgress } = await loadStore();

    const migrated = {
      cardId: legacyCard.id,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 500,
      nextSeeingAt,
      interval: 2,
    };
    expect(editLocalStudyProgress({ cardId: legacyCard.id })).toEqual(migrated);
    expect(JSON.parse(localStorage.getItem("tango-local-study-progresses") ?? "null")).toEqual({
      state: { localProgresses: [{ ...migrated, nextSeeingAt: nextSeeingAt.toISOString() }] },
      version: 1,
    });

    localStorage.setItem(
      "tango-local-cards",
      JSON.stringify({ state: { localCards: [{ ...legacyCard, score: 9 }] }, version: 1 })
    );
    const { editLocalStudyProgress: editReloadedProgress } = await loadStore();
    expect(editReloadedProgress({ cardId: legacyCard.id })).toEqual(migrated);
  });

  it("creates, edits, and deletes local progress synchronously", async () => {
    const { createLocalStudyProgress, deleteLocalStudyProgress, deleteLocalStudyProgresses, editLocalStudyProgress } =
      await loadStore();
    expect(createLocalStudyProgress(createStudyProgress("first"))).toEqual(createStudyProgress("first"));
    createLocalStudyProgress(createStudyProgress("second"));

    expect(editLocalStudyProgress({ cardId: "first", score: 3 })).toEqual({
      ...createStudyProgress("first"),
      score: 3,
    });

    deleteLocalStudyProgress("first");
    deleteLocalStudyProgresses(["second"]);
    expect(() => editLocalStudyProgress({ cardId: "first" })).toThrow('Local StudyProgress "first" was not found');
    expect(() => editLocalStudyProgress({ cardId: "second" })).toThrow('Local StudyProgress "second" was not found');
  });

  it("fails when local progress is missing", async () => {
    const { editLocalStudyProgress } = await loadStore();
    expect(() => editLocalStudyProgress({ cardId: "missing", score: 1 })).toThrow(
      'Local StudyProgress "missing" was not found'
    );
  });
});
