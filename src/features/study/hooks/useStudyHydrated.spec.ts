import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { studyStore } from "@/features/study/state/studyStore";

describe("useStudyHydrated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes to hydration start and finish without an effect state update", () => {
    let hydrated = false;
    let notifyStart: (() => void) | undefined;
    let notifyFinish: (() => void) | undefined;
    vi.spyOn(studyStore.persist, "hasHydrated").mockImplementation(() => hydrated);
    vi.spyOn(studyStore.persist, "onHydrate").mockImplementation((listener) => {
      notifyStart = () => listener(studyStore.getState());
      return () => {
        notifyStart = undefined;
      };
    });
    vi.spyOn(studyStore.persist, "onFinishHydration").mockImplementation((listener) => {
      notifyFinish = () => listener(studyStore.getState());
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
