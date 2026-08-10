/**
 * @file Verifies the "useStudyHydrated" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "subscribes to hydration
 * start and finish without an effect state update".
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { studyStore } from "../store/studyStore";

const { getState, persist } = studyStore;

describe("useStudyHydrated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes to hydration start and finish without an effect state update", () => {
    let hydrated = false;
    let notifyStart: (() => void) | undefined;
    let notifyFinish: (() => void) | undefined;
    vi.spyOn(persist, "hasHydrated").mockImplementation(() => hydrated);
    vi.spyOn(persist, "onHydrate").mockImplementation((listener) => {
      notifyStart = () => listener(getState());
      return () => {
        notifyStart = undefined;
      };
    });
    vi.spyOn(persist, "onFinishHydration").mockImplementation((listener) => {
      notifyFinish = () => listener(getState());
      return () => {
        notifyFinish = undefined;
      };
    });

    const { result } = renderHook(useStudyHydrated);
    expect(result.current).toBe(false);

    act(() => {
      hydrated = true;
      notifyFinish?.();
    });
    expect(result.current).toBe(true);

    act(() => {
      hydrated = false;
      notifyStart?.();
    });
    expect(result.current).toBe(false);
  });
});
