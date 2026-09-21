import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useStudySessions } from "@/entities/study-session";
import { createCard, createDeck, createPreferences } from "@/test/factories";

import { resumeStudy } from "../model/actions/resumeStudy";
import { DeckListPage } from "./DeckListPage";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  useCards: vi.fn(),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDecks: vi.fn(),
}));
vi.mock("@/entities/preference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preference")>()),
  usePreferences: vi.fn(),
}));
vi.mock("@/entities/study-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-session")>()),
  useStudySessions: vi.fn(),
}));
vi.mock("../model/actions/bootstrapSampleDeck", () => ({ bootstrapSampleDeck: () => undefined }));
vi.mock("../model/actions/resumeStudy", () => ({ resumeStudy: vi.fn() }));

const sessions = {
  active: {
    sessionId: "session-active",
    deckId: "active",
    cardOrderIds: ["a"],
    currentIndex: 0,
    lastStudiedAt: 0,
    remote: { uid: "user-id", startedAt: 0 },
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<DeckListPage />} />
        <Route path="/deck/:id/start" element={<h1>Study setup</h1>} />
        <Route path="/deck/:id/study" element={<h1>Continue destination</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe("DECK-NAVIGATION-12 Deck review navigation", () => {
  beforeEach(() => {
    vi.mocked(useDecks).mockReturnValue([
      createDeck({ id: "due", name: "Due" }),
      createDeck({ id: "new", name: "New" }),
      createDeck({ id: "active", name: "Active" }),
    ]);
    vi.mocked(useCards).mockReturnValue([
      createCard({ id: "due", deckId: "due", nextSeeingAt: new Date(0) }),
      createCard({ id: "new", deckId: "new" }),
      createCard({ id: "a", deckId: "active", nextSeeingAt: new Date("2999-01-01") }),
    ]);
    vi.mocked(useStudySessions).mockReturnValue(sessions);
    vi.mocked(usePreferences).mockReturnValue(createPreferences({ useCardInterval: true, loadSample: false }));
    vi.mocked(resumeStudy).mockReset().mockResolvedValue(true);
  });

  it.each(["Review Due", "Study new cards in New"])(
    "opens existing setup from %s without resuming a Session",
    async (label) => {
      renderPage();
      await userEvent.click(screen.getByRole("button", { name: label }));
      expect(await screen.findByRole("heading", { name: "Study setup" })).toBeVisible();
      expect(resumeStudy).not.toHaveBeenCalled();
      expect(sessions.active.cardOrderIds).toEqual(["a"]);
      expect(sessions.active.currentIndex).toBe(0);
    }
  );

  it("preserves the existing Continue action even with zero due/new counts", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Continue Active" }));
    expect(await screen.findByRole("heading", { name: "Continue destination" })).toBeVisible();
    expect(resumeStudy).toHaveBeenCalledWith("active");
  });
});
