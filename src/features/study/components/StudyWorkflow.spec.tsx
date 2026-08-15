import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as Preferences | null,
  hydrated: true,
  update: vi.fn(),
  onUnavailable: vi.fn(),
  touchStudySession: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
  fetchCardFromServer: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return { ...actual, fetchCardFromServer: mocks.fetchCardFromServer };
});
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => {
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    return mocks.preferences;
  },
  toggleShowHeader: mocks.toggleShowHeader,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
}));
vi.mock("../hooks/useEditStudyProgress", () => ({
  useEditStudyProgress: () => ({ update: mocks.update }),
}));
vi.mock("../hooks/useStudyHydrated", () => ({
  useStudyHydrated: () => mocks.hydrated,
}));
vi.mock("../commands/studySessionCommands", () => ({
  touchStudySession: mocks.touchStudySession,
}));

import { StudyWorkflow, type StudyWorkflowState } from "./StudyWorkflow";
import { studyStore } from "../state/studyStoreInstance";

const deckId: DeckId = "deck-id";
const createCard = (id: string): Card => ({
  id,
  deckId,
  uid: "user-id",
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
});
const cards = [createCard("card-1"), createCard("card-2"), createCard("card-3")];

const WorkflowView = ({ state }: { state: StudyWorkflowState }) => {
  if (state.status === "error") {
    return (
      <button type="button" onClick={state.retry}>
        retry
      </button>
    );
  }
  if (state.status !== "ready") return <div>{state.status}</div>;
  return (
    <div>
      <div>{state.card.id}</div>
      <div data-testid="back">{String(state.showBackText)}</div>
      <div data-testid="autoplay">{String(state.controller.autoPlay)}</div>
      <div data-testid="index">{state.controller.index}</div>
      <div data-testid="feedback">{state.swipeFeedback ?? "none"}</div>
      <button type="button" onClick={state.actions.toggleShowBackText}>
        toggle back
      </button>
      <button type="button" onClick={state.actions.swipeLeft}>
        swipe left
      </button>
      <button type="button" onClick={state.actions.swipeRight}>
        swipe right
      </button>
    </div>
  );
};

const renderWorkflow = (currentCards: readonly Card[] = cards) =>
  render(
    <StudyWorkflow cards={currentCards} deckId={deckId} uid="user-id" onUnavailable={mocks.onUnavailable}>
      {(state) => <WorkflowView state={state} />}
    </StudyWorkflow>
  );

describe("StudyWorkflow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.hydrated = true;
    mocks.update.mockResolvedValue(undefined);
    mocks.fetchCardFromServer.mockReturnValue(new Promise(() => undefined));
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showHeader: true,
      showSwipeFeedback: true,
      cardSwipeLeft: "GoToNextCardMastered",
      cardSwipeRight: "GoToNextCardMastered",
    });
    studyStore.setState({ sessionsByDeckId: {} });
    studyStore.getState().startStudy(
      deckId,
      cards.map(({ id }) => id)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("selects the active Card and connects shortcuts to current actions", async () => {
    renderWorkflow();

    expect(screen.getByText("card-1")).toBeVisible();
    expect(mocks.fetchCardFromServer).not.toHaveBeenCalled();
    expect(mocks.touchStudySession).toHaveBeenCalledWith(deckId);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByTestId("back")).toHaveTextContent("true");
    fireEvent.keyDown(window, { key: "h" });
    fireEvent.keyDown(window, { key: "b" });
    expect(mocks.toggleShowHeader).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByText("card-2")).toBeVisible());
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("waits for Card readiness and exits only after hydration confirms unavailability", async () => {
    const { unmount } = renderWorkflow([]);
    expect(screen.getByText("loading")).toBeVisible();
    expect(mocks.onUnavailable).not.toHaveBeenCalled();
    unmount();

    studyStore.setState({ sessionsByDeckId: {} });
    mocks.hydrated = false;
    const view = renderWorkflow();
    expect(screen.getByText("unavailable")).toBeVisible();
    expect(mocks.onUnavailable).not.toHaveBeenCalled();

    mocks.hydrated = true;
    view.rerender(
      <StudyWorkflow cards={cards} deckId={deckId} uid="user-id" onUnavailable={mocks.onUnavailable}>
        {(state) => <WorkflowView state={state} />}
      </StudyWorkflow>
    );
    await waitFor(() => expect(mocks.onUnavailable).toHaveBeenCalledOnce());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();
  });

  it("uses an active remote target without resetting the session", async () => {
    mocks.fetchCardFromServer.mockResolvedValueOnce(cards[0]);
    renderWorkflow([]);

    expect(await screen.findByText("card-1")).toBeVisible();
    expect(mocks.fetchCardFromServer).toHaveBeenCalledOnce();
    expect(mocks.onUnavailable).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "swipe right" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
  });

  it("cleans up a missing remote target", async () => {
    mocks.fetchCardFromServer.mockResolvedValueOnce(undefined);
    renderWorkflow([]);

    await waitFor(() => expect(mocks.onUnavailable).toHaveBeenCalledOnce());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();
  });

  it.each([
    ["deleted", { deletedAt: 1 }],
    ["another Deck", { deckId: "other-deck" }],
    ["another user", { uid: "other-user" }],
  ])("cleans up a remote target belonging to %s", async (_label, overrides) => {
    mocks.fetchCardFromServer.mockResolvedValueOnce({ ...cards[0], ...overrides });
    renderWorkflow([]);

    await waitFor(() => expect(mocks.onUnavailable).toHaveBeenCalledOnce());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();
  });

  it("keeps the session and offers retry when the server read fails", async () => {
    mocks.fetchCardFromServer.mockRejectedValueOnce(new Error("offline"));
    renderWorkflow([]);

    const retry = await screen.findByRole("button", { name: "retry" });
    expect(mocks.onUnavailable).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeDefined();

    mocks.fetchCardFromServer.mockResolvedValueOnce(cards[0]);
    fireEvent.click(retry);
    expect(await screen.findByText("card-1")).toBeVisible();
    expect(mocks.fetchCardFromServer).toHaveBeenCalledTimes(2);
  });

  it("restarts repeated swipe feedback timing", async () => {
    vi.useFakeTimers();
    renderWorkflow();

    fireEvent.click(screen.getByRole("button", { name: "swipe left" }));
    await Promise.resolve();
    expect(screen.getByTestId("feedback")).toHaveTextContent("cardSwipeLeft");
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByRole("button", { name: "swipe left" }));
    await Promise.resolve();

    act(() => vi.advanceTimersByTime(899));
    expect(screen.getByTestId("feedback")).toHaveTextContent("cardSwipeLeft");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("feedback")).toHaveTextContent("none");
  });

  it("rolls back feedback, Card position, and back visibility after mutation failure", async () => {
    mocks.update.mockRejectedValueOnce(new Error("write failed"));
    renderWorkflow();
    fireEvent.click(screen.getByRole("button", { name: "toggle back" }));
    fireEvent.click(screen.getByRole("button", { name: "swipe right" }));

    await waitFor(() => expect(screen.getByTestId("index")).toHaveTextContent("0"));
    expect(screen.getByTestId("back")).toHaveTextContent("true");
    expect(screen.getByTestId("feedback")).toHaveTextContent("none");
  });

  it("drives the controller from autoplay preferences", () => {
    vi.useFakeTimers();
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    mocks.preferences = createPreferences({
      ...mocks.preferences,
      study: { ...mocks.preferences.study, defaultAutoPlay: true, cardInterval: 1 },
    });
    renderWorkflow();

    expect(screen.getByTestId("autoplay")).toHaveTextContent("true");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId("index")).toHaveTextContent("1");
  });
});
