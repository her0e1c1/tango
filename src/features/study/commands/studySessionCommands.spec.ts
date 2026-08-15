import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "../state/studyStoreInstance";
import { initializeStudySessionUi, removeStudySession, touchStudySession } from "./studySessionCommands";

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
    });

    initializeStudySessionUi(true);

    expect(studyStore.getState()).toMatchObject({
      showBackText: false,
      autoPlay: true,
    });
  });
});
