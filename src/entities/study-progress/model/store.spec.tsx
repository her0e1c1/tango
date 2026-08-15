import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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
