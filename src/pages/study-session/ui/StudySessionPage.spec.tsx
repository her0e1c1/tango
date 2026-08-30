import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { deleteCard, mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { clearStudySessions, getStudySession, startStudy } from "@/entities/study-session";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  editStudyProgress: vi.fn(),
  removeStudySession: vi.fn(),
  setDarkMode: vi.fn(),
  touchStudySession: vi.fn(),
  toggleShowPlaybackControls: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  toggleShowPlaybackControls: mocks.toggleShowPlaybackControls,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
}));
vi.mock("@/entities/study-session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/study-session")>();
  return {
    ...original,
    removeStudySession: (...args: Parameters<typeof original.removeStudySession>) => {
      mocks.removeStudySession(...args);
      original.removeStudySession(...args);
    },
    touchStudySession: (...args: Parameters<typeof original.touchStudySession>) => {
      mocks.touchStudySession(...args);
      original.touchStudySession(...args);
    },
  };
});
// Persistence is outside Page behavior; successful writes let the real study workflow advance.
vi.mock("@/entities/study-progress", () => ({ editStudyProgress: mocks.editStudyProgress }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { StudySessionPage } from "./StudySessionPage";

describe("StudySessionPage", () => {
  const deckId = "deck-id";
  const deck = createLocalDeck({ id: deckId, name: "Study deck", category: "raw" });
  const firstCard = createLocalCard({
    id: "first-card",
    deckId,
    frontText: "Front one",
    backText: "Back one",
    uniqueKey: "first-card",
    score: 2,
    numberOfSeen: 3,
  });
  const secondCard = createLocalCard({
    id: "second-card",
    deckId,
    frontText: "Front two",
    backText: "Back two",
    uniqueKey: "second-card",
    score: 1,
    numberOfSeen: 4,
  });
  const renderPage = (path = `/deck/${deckId}/study`) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<h1>Deck list destination</h1>} />
          <Route path="/deck/:id/study" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>
    );
  const openStudyActions = () => {
    fireEvent.click(screen.getByRole("button", { name: "Open study actions" }));
    return screen.getByRole("group", { name: "Study actions" });
  };

  beforeEach(async () => {
    clearStudySessions();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.editStudyProgress.mockReset().mockResolvedValue(undefined);
    mocks.removeStudySession.mockReset();
    mocks.setDarkMode.mockReset();
    mocks.touchStudySession.mockReset();
    mocks.toggleShowPlaybackControls.mockReset();
    mocks.toggleShowSwipeButtonList.mockReset();
    await createDeck("", deck);
    await mutateCards("", [
      { kind: "create", card: firstCard },
      { kind: "create", card: secondCard },
    ]);
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study);
  });

  it("renders the active session from stored Entity state", () => {
    renderPage();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study actions" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("reveals the current answer from the Enter shortcut", () => {
    renderPage();

    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("Back one")).toBeVisible();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Score 2, positive")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Playback controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("ignores directional shortcuts while showing the answer", async () => {
    mocks.preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoToNextCard",
        cardSwipeDown: "GoToNextCard",
        cardSwipeLeft: "GoToNextCard",
        cardSwipeRight: "GoToNextCard",
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.keyboard("{Enter}");

    await user.keyboard("{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}");

    expect(screen.getByText("Back one")).toBeVisible();
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("keeps the ArrowRight shortcut active while the front card is focused", async () => {
    const user = userEvent.setup();
    renderPage();

    const front = screen.getByRole("button", { name: "Front one" });
    front.focus();
    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
  });

  it("returns from a deep-linked Study to the Deck list without changing the resumable session", () => {
    renderPage();
    const sessionBeforeExit = getStudySession(deckId);
    openStudyActions();

    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));

    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);
    expect(mocks.removeStudySession).not.toHaveBeenCalled();
  });

  it("keeps study actions available while the Header stays hidden", () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });

    renderPage();
    const actions = openStudyActions();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(actions).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByLabelText("Score 2, positive")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("delegates visibility toggles to persisted preference actions", () => {
    renderPage();
    openStudyActions();

    fireEvent.click(screen.getByRole("button", { name: "Swipe controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Playback controls" }));

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledOnce();
  });

  it.each([
    ["swipe", "Swipe controls", "{Enter}"],
    ["swipe", "Swipe controls", " "],
    ["playback", "Playback controls", "{Enter}"],
    ["playback", "Playback controls", " "],
  ] as const)("uses %s visibility with %s without running a Study shortcut", async (control, label, key) => {
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    screen.getByRole("button", { name: label }).focus();
    await user.keyboard(key);

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledTimes(control === "swipe" ? 1 : 0);
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledTimes(control === "playback" ? 1 : 0);
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps the swipe visibility shortcut active while a toolbar button is focused", async () => {
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    swipeToggle.focus();
    await user.keyboard("b");

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
  });

  it.each(["{ArrowUp}", "{ArrowDown}", "{ArrowLeft}", "{ArrowRight}"])(
    "keeps %s native to the focused progress slider",
    async (key) => {
      mocks.preferences = createPreferences({
        controls: {
          cardSwipeUp: "GoToNextCard",
          cardSwipeDown: "GoToNextCard",
          cardSwipeLeft: "GoToNextCard",
          cardSwipeRight: "GoToNextCard",
        },
      });
      const user = userEvent.setup();
      renderPage();

      const progress = screen.getByRole("slider", { name: "Study progress" });
      progress.focus();
      await user.keyboard(key);

      expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    }
  );

  it("renders the selected visibility combination", () => {
    mocks.preferences = createPreferences({
      controls: { showSwipeButtonList: false, showPlaybackControls: false },
    });

    renderPage();
    openStudyActions();

    expect(screen.getByRole("button", { name: "Swipe controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Playback controls" })).not.toBePressed();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("disables playback visibility when the card interval is zero", () => {
    mocks.preferences = createPreferences({ cardInterval: 0 });

    renderPage();
    openStudyActions();

    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
    expect(playbackToggle).toHaveAccessibleDescription(
      "Playback controls unavailable because the card interval is set to 0"
    );
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("shows loading feedback while active session cards are unavailable", async () => {
    await deleteCard("", firstCard);
    await deleteCard("", secondCard);
    clearStudySessions();
    startStudy(deckId, [firstCard], mocks.preferences.study);

    renderPage();

    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
  });

  it("returns to the deck list when no active session exists", async () => {
    clearStudySessions();
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    renderPage("/deck/missing-deck/study");

    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
    expect(mocks.removeStudySession).not.toHaveBeenCalled();
    expect(mocks.touchStudySession).not.toHaveBeenCalled();
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <StudySessionPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
