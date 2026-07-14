import React from "react";

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as type from "@src/action/type";
import { useLegacyStudySession } from "@src/features/study/containers/useLegacyStudySession";
import { studyStore } from "@src/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mocks.dispatch,
}));

type LegacyStudyCandidate = Pick<Deck, "id" | "cardOrderIds" | "currentIndex">;

const legacyDeck = (overrides: Partial<LegacyStudyCandidate> = {}): LegacyStudyCandidate => ({
  id: "deck-1",
  cardOrderIds: ["card-1", "card-2"],
  currentIndex: 1,
  ...overrides,
});

const Harness: React.FC<{
  routeDeckId: DeckId;
  candidate?: LegacyStudyCandidate;
}> = ({ routeDeckId, candidate }) => {
  useLegacyStudySession(routeDeckId, candidate);
  return null;
};

describe("useLegacyStudySession", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.dispatch.mockReset();
    studyStore.setState({
      session: null,
      legacyMigratedDeckIds: {},
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("imports and clears a legacy session once under StrictMode", async () => {
    render(
      <React.StrictMode>
        <Harness routeDeckId="deck-1" candidate={legacyDeck()} />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalledTimes(1);
    });
    expect(mocks.dispatch).toHaveBeenCalledWith(type.deckClearLegacyStudy("deck-1"));
    expect(studyStore.getState().session).toEqual({
      deckId: "deck-1",
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 1,
    });
    expect(studyStore.getState().legacyMigratedDeckIds).toEqual({ "deck-1": true });
  });

  it("keeps an existing new-format session", () => {
    studyStore.getState().startStudy("deck-new", ["card-new"]);

    render(<Harness routeDeckId="deck-1" candidate={legacyDeck()} />);

    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toEqual({
      deckId: "deck-new",
      cardOrderIds: ["card-new"],
      currentIndex: 0,
    });
  });

  it("rejects a candidate that does not match the route deck", () => {
    render(<Harness routeDeckId="deck-1" candidate={legacyDeck({ id: "deck-2" })} />);

    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toBeNull();
    expect(studyStore.getState().legacyMigratedDeckIds).toEqual({});
  });

  it.each([
    ["empty card order", legacyDeck({ cardOrderIds: [] })],
    ["missing current index", legacyDeck({ currentIndex: null })],
  ])("rejects a candidate with %s", (_label, candidate) => {
    render(<Harness routeDeckId="deck-1" candidate={candidate} />);

    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toBeNull();
  });

  it("does not import a deck already marked as migrated", () => {
    studyStore.getState().markLegacyMigrated("deck-1");

    render(<Harness routeDeckId="deck-1" candidate={legacyDeck()} />);

    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toBeNull();
  });

  it("does not re-import stale progress after reset and remount", async () => {
    const first = render(<Harness routeDeckId="deck-1" candidate={legacyDeck()} />);
    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalledTimes(1);
    });
    first.unmount();
    studyStore.getState().resetStudy();
    mocks.dispatch.mockClear();

    render(<Harness routeDeckId="deck-1" candidate={legacyDeck()} />);

    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toBeNull();
    expect(studyStore.getState().legacyMigratedDeckIds).toEqual({ "deck-1": true });
  });
});
