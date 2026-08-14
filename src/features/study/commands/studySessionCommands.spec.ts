import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "../state/studyStoreInstance";
import {
  initializeStudySessionUi,
  reconcileStudySessionsWithDecks,
  removeStudySession,
  touchStudySession,
} from "./studySessionCommands";

describe("study session commands", () => {
  beforeEach(() => {
    studyStore.setState({
      sessionsByDeckId: {
        first: { deckId: "first", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 100 },
        second: { deckId: "second", cardOrderIds: ["card-2"], currentIndex: 0, lastStudiedAt: 200 },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    studyStore.setState({ sessionsByDeckId: {} });
  });

  it("touches and removes only the requested session", () => {
    vi.spyOn(Date, "now").mockReturnValue(900);

    touchStudySession("first");
    removeStudySession("second");

    expect(studyStore.getState().sessionsByDeckId).toEqual({
      first: { deckId: "first", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 900 },
    });
  });

  it("initializes transient study controls", () => {
    studyStore.setState({
      showBackText: true,
      autoPlay: false,
      lastSwipe: { direction: "cardSwipeLeft", eventId: 1 },
    });

    initializeStudySessionUi(true);

    expect(studyStore.getState()).toMatchObject({
      showBackText: false,
      autoPlay: true,
      lastSwipe: undefined,
    });
  });

  it("discards sessions whose decks are unavailable", () => {
    reconcileStudySessionsWithDecks(["second"]);

    expect(studyStore.getState().sessionsByDeckId).toEqual({
      second: { deckId: "second", cardOrderIds: ["card-2"], currentIndex: 0, lastStudiedAt: 200 },
    });
  });

  it("waits for hydration before discarding sessions", () => {
    let finishHydration: () => void = () => undefined;
    const unsubscribe = vi.fn();
    vi.spyOn(studyStore.persist, "hasHydrated").mockReturnValue(false);
    vi.spyOn(studyStore.persist, "onFinishHydration").mockImplementation((listener) => {
      finishHydration = () => listener(studyStore.getState());
      return unsubscribe;
    });

    const cancel = reconcileStudySessionsWithDecks(["second"]);
    expect(studyStore.getState().sessionsByDeckId).toHaveProperty("first");

    finishHydration();
    expect(studyStore.getState().sessionsByDeckId).not.toHaveProperty("first");
    cancel();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
