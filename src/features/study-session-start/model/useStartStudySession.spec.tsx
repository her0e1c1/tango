import type { Preferences } from "@/entities/preferences";
import { clearStudySessions, getStudySession } from "@/entities/study-session";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createPreferences, createStudyProgress } from "@/test/factories";
import { useStartStudySession } from "./useStartStudySession";

const mocks = vi.hoisted(() => ({ preferences: null as unknown as Preferences }));

vi.mock("@/entities/preferences", () => ({ usePreferences: () => mocks.preferences }));

describe("useStartStudySession", () => {
  const makeCard = (id: string, numberOfSeen = 0) => {
    const card = createCard({ id });
    return { card, progress: createStudyProgress({ cardId: card.id, numberOfSeen }) };
  };

  beforeEach(async () => {
    await clearStudySessions();
    localStorage.clear();
    mocks.preferences = createPreferences({ shuffled: false, maxNumberOfCardsToLearn: 2 });
  });

  it("starts at index zero with the configured card order before notifying the page", () => {
    const cards = [makeCard("first", 3), makeCard("second", 2), makeCard("third", 1)];
    const onStarted = vi.fn(() => {
      expect(getStudySession("deck")?.currentIndex).toBe(0);
      expect(getStudySession("deck")?.cardOrderIds).toEqual(["third", "second"]);
    });
    const { result } = renderHook(() => useStartStudySession("deck", { onStarted }));

    act(() => result.current(cards));

    expect(onStarted).toHaveBeenCalledOnce();
  });

  it("copies the card order into the session", () => {
    const cards = [makeCard("first"), makeCard("second")];
    const { result } = renderHook(() => useStartStudySession("deck"));

    act(() => result.current(cards));
    cards.reverse();

    expect(getStudySession("deck")?.cardOrderIds).toEqual(["first", "second"]);
  });
});
