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
  fetchCardFromServer: vi.fn(),
  onExit: vi.fn(),
  onSetupStudy: vi.fn(),
  onBackToDeck: vi.fn(),
  touchStudySession: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  fetchCardFromServer: mocks.fetchCardFromServer,
}));
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

import { StudyWorkflow, type ActiveStudyWorkflowState } from "./StudyWorkflow";
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

const WorkflowView = ({ state }: { state: ActiveStudyWorkflowState }) => (
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

const renderWorkflow = (currentCards: readonly Card[] = cards) =>
  render(
    <StudyWorkflow
      cards={currentCards}
      deckId={deckId}
      deckName="Deck name"
      onExit={mocks.onExit}
      onSetupStudy={mocks.onSetupStudy}
      onBackToDeck={mocks.onBackToDeck}
    >
      {(state) => <WorkflowView state={state} />}
    </StudyWorkflow>
  );

describe("StudyWorkflow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.hydrated = true;
    mocks.update.mockResolvedValue(undefined);
    mocks.fetchCardFromServer.mockResolvedValue(null);
    mocks.preferences = createPreferences({
      cardInterval: 1,
      defaultAutoPlay: false,
      showHeader: true,
      showSwipeFeedback: true,
      cardSwipeLeft: "GoToPrevCard",
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

  it("shows current controls in an accessible Help dialog and restores focus", () => {
    renderWorkflow();
    const trigger = screen.getByRole("button", { name: "Help" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Study help" });
    expect(dialog).toHaveTextContent("Swipe/Arrow Right");
    expect(dialog).toHaveTextContent("Mark mastered and next");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "ArrowRight" });
    expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Study help" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("preserves the session for explicit Exit and configured GoBack", async () => {
    const view = renderWorkflow();
    fireEvent.click(screen.getByRole("button", { name: "Exit study" }));
    expect(mocks.onExit).toHaveBeenCalledWith(deckId);
    expect(studyStore.getState().sessionsByDeckId[deckId]?.currentIndex).toBe(0);

    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    mocks.preferences = createPreferences({
      ...mocks.preferences,
      controls: { ...mocks.preferences.controls, cardSwipeLeft: "GoBack" },
    });
    view.unmount();
    renderWorkflow();
    fireEvent.click(screen.getByRole("button", { name: "swipe left" }));
    await waitFor(() => expect(mocks.onExit).toHaveBeenCalledTimes(2));
    expect(studyStore.getState().sessionsByDeckId[deckId]?.cardOrderIds).toEqual(cards.map(({ id }) => id));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("completes only after the final forward mutation succeeds and restarts the same order", async () => {
    const order = [cards[1]?.id ?? "", cards[0]?.id ?? ""];
    studyStore.getState().startStudy(deckId, order);
    studyStore.getState().setCurrentIndex(deckId, 1);
    renderWorkflow();

    fireEvent.click(screen.getByRole("button", { name: "swipe right" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Study complete" })).toBeVisible());
    expect(screen.getByText("Deck name")).toBeVisible();
    expect(screen.getByText("Completed 2 cards")).toBeVisible();
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Back to deck" }));
    expect(mocks.onBackToDeck).toHaveBeenCalledWith(deckId);

    fireEvent.click(screen.getByRole("button", { name: "Restart session" }));
    expect(screen.getByText("card-2")).toBeVisible();
    expect(studyStore.getState().sessionsByDeckId[deckId]).toMatchObject({ cardOrderIds: order, currentIndex: 0 });
  });

  it("keeps the final Card, session, and feedback contract when mutation fails", async () => {
    studyStore.getState().startStudy(deckId, [cards[0]?.id ?? ""]);
    mocks.update.mockRejectedValueOnce(new Error("write failed"));
    renderWorkflow();
    fireEvent.click(screen.getByRole("button", { name: "toggle back" }));
    fireEvent.click(screen.getByRole("button", { name: "swipe right" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(screen.queryByRole("heading", { name: "Study complete" })).not.toBeInTheDocument();
    expect(screen.getByTestId("back")).toHaveTextContent("true");
    expect(screen.getByTestId("feedback")).toHaveTextContent("none");
    expect(studyStore.getState().sessionsByDeckId[deckId]?.currentIndex).toBe(0);
  });

  it("treats previous on the first Card as a no-op", async () => {
    renderWorkflow();
    fireEvent.click(screen.getByRole("button", { name: "swipe left" }));
    await Promise.resolve();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("verifies a missing local Card before cleaning up a stale session", async () => {
    renderWorkflow([]);
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeDefined();

    await waitFor(() => expect(screen.getByRole("heading", { name: "Study session unavailable" })).toBeVisible());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Set up study" }));
    expect(mocks.onSetupStudy).toHaveBeenCalledWith(deckId);
  });

  it("does not verify or clean up while the Study store is hydrating", () => {
    mocks.hydrated = false;
    renderWorkflow([]);

    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
    expect(mocks.fetchCardFromServer).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeDefined();
  });

  it("cleans up a remotely confirmed deleted or mismatched Card", async () => {
    mocks.fetchCardFromServer.mockResolvedValueOnce({ ...cards[0], deletedAt: 1 });
    renderWorkflow([]);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Study session unavailable" })).toBeVisible());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeUndefined();
  });

  it("preserves the session and offers retry when Card verification fails", async () => {
    mocks.fetchCardFromServer.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(cards[0]);
    renderWorkflow([]);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Unable to verify study session" })).toBeVisible());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("card-1")).toBeVisible());
    expect(studyStore.getState().sessionsByDeckId[deckId]).toBeDefined();
  });

  it("stops autoplay on the final Card without completing", () => {
    vi.useFakeTimers();
    studyStore.getState().startStudy(deckId, [cards[0]?.id ?? ""]);
    if (mocks.preferences == null) throw new Error("Preferences not initialized");
    mocks.preferences = createPreferences({
      ...mocks.preferences,
      study: { ...mocks.preferences.study, defaultAutoPlay: true, cardInterval: 1 },
    });
    renderWorkflow();
    expect(screen.getByTestId("autoplay")).toHaveTextContent("true");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId("autoplay")).toHaveTextContent("false");
    expect(screen.queryByRole("heading", { name: "Study complete" })).not.toBeInTheDocument();
    expect(studyStore.getState().sessionsByDeckId[deckId]?.currentIndex).toBe(0);
  });
});
