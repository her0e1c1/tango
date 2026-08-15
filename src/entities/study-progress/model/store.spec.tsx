import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createStudyProgress } from "@/test/factories";
import { useStudyProgress, useStudyProgresses } from "./hooks";
import {
  clearRemoteStudyProgresses,
  createLocalStudyProgress,
  deleteLocalStudyProgress,
  deleteLocalStudyProgresses,
  editLocalStudyProgress,
  replaceRemoteStudyProgresses,
  studyProgressStore,
} from "./store";

const createMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
};

const useMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const storage = createMemoryStorage(initial);
  studyProgressStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("StudyProgress store", () => {
  beforeEach(() => {
    localStorage.clear();
    useMemoryStorage();
    studyProgressStore.setState({ remoteProgresses: [], localProgresses: [] });
  });

  it("combines remote and local progress reads while clearing only remote state", () => {
    const remote = createStudyProgress({ cardId: "remote" });
    const local = createStudyProgress({ cardId: "local" });
    studyProgressStore.setState({ localProgresses: [local] });

    replaceRemoteStudyProgresses([remote]);

    expect(renderHook(useStudyProgresses).result.current).toEqual([remote, local]);
    expect(renderHook(() => useStudyProgress("remote")).result.current).toEqual(remote);
    expect(renderHook(() => useStudyProgress("local")).result.current).toEqual(local);

    clearRemoteStudyProgresses();
    expect(studyProgressStore.getState()).toEqual({ remoteProgresses: [], localProgresses: [local] });
  });

  it("persists only local progress and restores scheduled dates", async () => {
    const storage = useMemoryStorage();
    const remote = createStudyProgress({ cardId: "remote" });
    const local = createStudyProgress({ cardId: "local", nextSeeingAt: new Date(1_000) });
    studyProgressStore.setState({ remoteProgresses: [remote], localProgresses: [local] });

    const persistedValue = (await storage.getItem("tango-local-study-progresses")) ?? "{}";
    expect(JSON.parse(persistedValue)).toEqual({
      state: { localProgresses: [{ ...local, nextSeeingAt: new Date(1_000).toISOString() }] },
      version: 1,
    });

    studyProgressStore.setState({ remoteProgresses: [], localProgresses: [] });
    useMemoryStorage({ "tango-local-study-progresses": persistedValue });
    await studyProgressStore.persist.rehydrate();
    expect(studyProgressStore.getState()).toEqual({ remoteProgresses: [], localProgresses: [local] });
  });

  it("migrates released local Card progress into its dedicated store once", async () => {
    const nextSeeingAt = new Date(1_000);
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
    vi.resetModules();
    const { studyProgressStore: migratedStore } = await import("./store");

    const migrated = createStudyProgress({
      cardId: legacyCard.id,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 500,
      nextSeeingAt,
      interval: 2,
    });
    expect(migratedStore.getState().localProgresses).toEqual([migrated]);
    expect(JSON.parse(localStorage.getItem("tango-local-study-progresses") ?? "null")).toEqual({
      state: { localProgresses: [{ ...migrated, nextSeeingAt: nextSeeingAt.toISOString() }] },
      version: 1,
    });

    localStorage.setItem(
      "tango-local-cards",
      JSON.stringify({ state: { localCards: [{ ...legacyCard, score: 9 }] }, version: 1 })
    );
    vi.resetModules();
    const { studyProgressStore: reloadedStore } = await import("./store");
    expect(reloadedStore.getState().localProgresses).toEqual([migrated]);
  });

  it("creates, edits, and deletes local progress synchronously", () => {
    expect(createLocalStudyProgress("first")).toEqual(createStudyProgress({ cardId: "first" }));
    createLocalStudyProgress("second");

    expect(editLocalStudyProgress({ cardId: "first", score: 3 })).toEqual(
      createStudyProgress({ cardId: "first", score: 3 })
    );

    deleteLocalStudyProgress("first");
    deleteLocalStudyProgresses(["second"]);
    expect(studyProgressStore.getState().localProgresses).toEqual([]);
  });

  it("fails when local progress is missing", () => {
    expect(() => editLocalStudyProgress({ cardId: "missing", score: 1 })).toThrow(
      'Local StudyProgress "missing" was not found'
    );
  });
});
