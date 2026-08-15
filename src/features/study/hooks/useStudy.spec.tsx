import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preferences";
import { clearStudySessions, startStudySession } from "@/entities/study-session";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as Preferences | null,
  editStudyProgress: vi.fn(),
  onUnavailable: vi.fn(),
  touchStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-1" }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
}));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));
vi.mock("@/entities/study-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-session")>()),
  touchStudySession: mocks.touchStudySession,
}));

import { useStudy } from "./useStudy";

const deckId = "deck-1";
const cards: Card[] = ["card-1", "card-2"].map((id) => ({
  id,
  deckId,
  uid: "user-1",
  frontText: id,
  backText: `${id}-back`,
  tags: [],
  uniqueKey: id,
  score: 0,
  numberOfSeen: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  lastSeenAt: 0,
}));

describe("useStudy", () => {
  beforeEach(async () => {
    await clearStudySessions();
    localStorage.clear();
    vi.clearAllMocks();
    mocks.editStudyProgress.mockResolvedValue(undefined);
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showHeader: true,
      showSwipeFeedback: true,
      cardSwipeRight: "GoToNextCardMastered",
    });
    startStudySession(
      deckId,
      cards.map(({ id }) => id)
    );
  });

  afterEach(() => vi.useRealTimers());

  it("coordinates display state, persistence, and session progression", async () => {
    const { result } = renderHook(() => useStudy(deckId, cards, mocks.onUnavailable));
    expect(result.current).toMatchObject({
      status: "studying",
      session: { deckId, cardOrderIds: ["card-1", "card-2"], currentIndex: 0 },
      card: { id: "card-1" },
      showBackText: false,
    });
    expect(result.current).not.toHaveProperty("index");
    expect(result.current).not.toHaveProperty("numberOfCards");
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deckId);

    act(() => result.current.toggleBackText());
    expect(result.current).toMatchObject({ status: "studying", showBackText: true });
    await actAsync(() => result.current.swipeRight());

    await waitFor(() => expect(result.current).toMatchObject({ status: "studying", card: { id: "card-2" } }));
    expect(result.current).toMatchObject({ showBackText: false, swipeFeedback: "cardSwipeRight" });
    expect(mocks.editStudyProgress).toHaveBeenCalledWith("user-1", expect.objectContaining({ cardId: "card-1" }));
  });

  it("reports loading while the session card is not available", () => {
    const { result } = renderHook(() => useStudy(deckId, [], mocks.onUnavailable));
    expect(result.current.status).toBe("loading");
    expect(mocks.onUnavailable).not.toHaveBeenCalled();
  });

  it("advances the session while autoplay is enabled", () => {
    vi.useFakeTimers();
    mocks.preferences = createPreferences({ cardInterval: 1, defaultAutoPlay: true });
    const { result } = renderHook(() => useStudy(deckId, cards, mocks.onUnavailable));

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toMatchObject({ status: "studying", card: { id: "card-2" } });
  });

  it("reports and handles an unavailable session", async () => {
    await clearStudySessions();
    const { result } = renderHook(() => useStudy(deckId, cards, mocks.onUnavailable));

    expect(result.current.status).toBe("unavailable");
    await waitFor(() => expect(mocks.onUnavailable).toHaveBeenCalledOnce());
  });
});
