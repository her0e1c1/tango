import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
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

const CardListDestination = () => {
  const { id } = useParams();
  return <h1>Cards for {id}</h1>;
};

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
          <Route path="/deck/:id" element={<CardListDestination />} />
          <Route path="/deck/:id/study" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>
    );

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
    expect(screen.getByRole("toolbar", { name: "Study actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeVisible();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("reveals the current answer from the Enter shortcut", () => {
    renderPage();

    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("Back one")).toBeVisible();
  });

  it("shows the next stored card after the ArrowRight shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
  });

  it("returns from a deep-linked Study to the same Deck without changing the resumable session", () => {
    renderPage();
    const sessionBeforeExit = getStudySession(deckId);

    fireEvent.click(screen.getByRole("button", { name: "Back to cards" }));

    expect(screen.getByRole("heading", { level: 1, name: `Cards for ${deckId}` })).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);
    expect(mocks.removeStudySession).not.toHaveBeenCalled();
  });

  it("keeps study actions available while the Header stays hidden", () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });

    renderPage();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Study actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeVisible();
    expect(screen.getByLabelText("Score 2, positive")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("delegates visibility toggles to persisted preference actions", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Hide swipe controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide playback controls" }));

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledOnce();
  });

  it.each([
    ["swipe", "Hide swipe controls", "{Enter}"],
    ["swipe", "Hide swipe controls", " "],
    ["playback", "Hide playback controls", "{Enter}"],
    ["playback", "Hide playback controls", " "],
  ] as const)("uses %s visibility with %s without running a Study shortcut", async (control, label, key) => {
    const user = userEvent.setup();
    renderPage();

    screen.getByRole("button", { name: label }).focus();
    await user.keyboard(key);

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledTimes(control === "swipe" ? 1 : 0);
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledTimes(control === "playback" ? 1 : 0);
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("renders the selected visibility combination", () => {
    mocks.preferences = createPreferences({
      controls: { showSwipeButtonList: false, showPlaybackControls: false },
    });

    renderPage();

    expect(screen.getByRole("button", { name: "Show swipe controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Show playback controls" })).not.toBePressed();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("disables playback visibility when the card interval is zero", () => {
    mocks.preferences = createPreferences({ cardInterval: 0 });

    renderPage();

    const playbackToggle = screen.getByRole("button", {
      name: "Playback controls unavailable because the card interval is set to 0",
    });
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
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
