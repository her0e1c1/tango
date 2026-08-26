import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStudyProgress } from "./defaults";

// Reloads the module so each scenario exercises initialization and migration from fresh storage.
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

  it("hydrates valid progress while discarding a malformed neighboring record", async () => {
    const valid = { ...createStudyProgress("valid"), nextSeeingAt: new Date(1000) };
    localStorage.setItem(
      "tango-local-study-progresses",
      JSON.stringify({
        state: {
          localProgresses: [
            { ...valid, nextSeeingAt: valid.nextSeeingAt.toISOString() },
            { ...createStudyProgress("malformed"), numberOfSeen: "invalid" },
          ],
        },
        version: 1,
      })
    );

    const { editLocalStudyProgress } = await loadStore();

    expect(editLocalStudyProgress({ cardId: valid.cardId })).toEqual(valid);
    expect(() => editLocalStudyProgress({ cardId: "malformed" })).toThrow(
      'Local StudyProgress "malformed" was not found'
    );
  });

  it("migrates valid legacy Card progress once and defaults missing counters", async () => {
    const nextSeeingAt = new Date(1000);
    const legacyCards = [
      {
        id: "legacy-card",
        frontText: "Legacy",
        score: 3,
        numberOfSeen: 4,
        lastSeenAt: 500,
        nextSeeingAt: nextSeeingAt.toISOString(),
        interval: 2,
      },
      { id: "legacy-defaults", frontText: "Defaults" },
      { id: "malformed", score: "invalid", numberOfSeen: 1 },
    ];
    localStorage.setItem("tango-local-cards", JSON.stringify({ state: { localCards: legacyCards }, version: 1 }));

    const { editLocalStudyProgress } = await loadStore();

    const migrated = {
      cardId: "legacy-card",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 500,
      nextSeeingAt,
      interval: 2,
    };
    expect(editLocalStudyProgress({ cardId: "legacy-card" })).toEqual(migrated);
    expect(editLocalStudyProgress({ cardId: "legacy-defaults" })).toEqual(createStudyProgress("legacy-defaults"));
    expect(() => editLocalStudyProgress({ cardId: "malformed" })).toThrow(
      'Local StudyProgress "malformed" was not found'
    );
    expect(JSON.parse(localStorage.getItem("tango-local-study-progresses") ?? "null")).toEqual({
      state: {
        localProgresses: [
          { ...migrated, nextSeeingAt: nextSeeingAt.toISOString() },
          createStudyProgress("legacy-defaults"),
        ],
      },
      version: 1,
    });
  });

  it("prefers an existing dedicated key over legacy Card progress", async () => {
    localStorage.setItem(
      "tango-local-study-progresses",
      JSON.stringify({ state: { localProgresses: [createStudyProgress("dedicated")] }, version: 1 })
    );
    localStorage.setItem(
      "tango-local-cards",
      JSON.stringify({ state: { localCards: [{ id: "legacy", score: 5, numberOfSeen: 6 }] }, version: 1 })
    );

    const { editLocalStudyProgress } = await loadStore();

    expect(editLocalStudyProgress({ cardId: "dedicated" })).toEqual(createStudyProgress("dedicated"));
    expect(() => editLocalStudyProgress({ cardId: "legacy" })).toThrow('Local StudyProgress "legacy" was not found');
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
