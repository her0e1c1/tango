import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { deleteCard, mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { clearStudySessions, startStudy } from "@/entities/study-session";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  editStudyProgress: vi.fn(),
  removeStudySession: vi.fn(),
  setDarkMode: vi.fn(),
  touchStudySession: vi.fn(),
  toggleShowHeader: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  toggleShowHeader: mocks.toggleShowHeader,
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

  beforeEach(async () => {
    clearStudySessions();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.editStudyProgress.mockReset().mockResolvedValue(undefined);
    mocks.removeStudySession.mockReset();
    mocks.setDarkMode.mockReset();
    mocks.touchStudySession.mockReset();
    mocks.toggleShowHeader.mockReset();
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

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
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
