import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudySession } from "@/entities/study-session";
import { useDeckListState } from "@/features/deck-list";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteDeck: vi.fn(),
  downloadTextFile: vi.fn(),
  touchStudySession: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.downloadTextFile }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  deleteDeck: mocks.deleteDeck,
  useDecks: () => [otherDeck, oldDeck, recentDeck],
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  useCards: () => cards,
}));
vi.mock("@/entities/study-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-session")>()),
  touchStudySession: mocks.touchStudySession,
  useStudySessions: () => sessionsByDeckId,
}));

import { DeckList } from "./DeckList";

const recentDeck = createDeck({ id: "recent", name: "Recent deck", category: "math" });
const oldDeck = createDeck({ id: "old", name: "Old deck", category: "design" });
const otherDeck = createDeck({ id: "other", name: "Alpha deck", category: "history" });
const cards = [
  createCard({ id: "other-1", deckId: otherDeck.id }),
  createCard({ id: "other-2", deckId: otherDeck.id }),
  createCard({ id: "recent-1", deckId: recentDeck.id }),
  createCard({ id: "recent-2", deckId: recentDeck.id }),
];
const sessionsByDeckId: Partial<Record<string, StudySession>> = {
  [oldDeck.id]: {
    sessionId: "session-old",
    deckId: oldDeck.id,
    cardOrderIds: ["old-1", "old-2"],
    currentIndex: 0,
    lastStudiedAt: 1000,
  },
  [recentDeck.id]: {
    sessionId: "session-recent",
    deckId: recentDeck.id,
    cardOrderIds: ["recent-1", "recent-2", "recent-3"],
    currentIndex: 1,
    lastStudiedAt: 2000,
  },
};

const actions = {
  onViewDeck: vi.fn(),
  onContinueDeck: vi.fn(),
  onStartDeck: vi.fn(),
  onEditDeck: vi.fn(),
};

const DeckListHarness = () => {
  const state = useDeckListState();

  return <DeckList state={state} {...actions} />;
};

const renderDeckList = () => render(<DeckListHarness />);

describe("DeckList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteDeck.mockResolvedValue(undefined);
  });

  it("builds studying and other sections from its inputs", () => {
    renderDeckList();

    const studying = screen.getByRole("region", { name: "Studying" });
    expect(
      within(studying)
        .getAllByRole("button", { name: /^View / })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["View Recent deck", "View Old deck"]);
    expect(within(studying).getByText(/2 \/ 3/)).toBeInTheDocument();

    const other = screen.getByRole("region", { name: "Other decks" });
    expect(within(other).getByRole("button", { name: "View Alpha deck" })).toBeInTheDocument();
    expect(within(other).getByText("2 cards")).toBeInTheDocument();
  });

  it("coordinates navigation intents and resolves download input", () => {
    renderDeckList();

    fireEvent.click(screen.getByRole("button", { name: "View Alpha deck" }));
    expect(actions.onViewDeck).toHaveBeenCalledExactlyOnceWith(otherDeck.id);

    fireEvent.click(screen.getByRole("button", { name: "Study Alpha deck" }));
    expect(actions.onStartDeck).toHaveBeenCalledExactlyOnceWith(otherDeck.id);

    fireEvent.click(screen.getByRole("button", { name: "Continue Recent deck" }));
    expect(mocks.touchStudySession).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(actions.onContinueDeck).toHaveBeenCalledExactlyOnceWith(recentDeck.id);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Alpha deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      "Alpha deck.csv",
      "text/plain;charset=utf-8"
    );

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Alpha deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(actions.onEditDeck).toHaveBeenCalledExactlyOnceWith(otherDeck.id);
  });

  it("owns deletion confirmation and success feedback", async () => {
    renderDeckList();
    const trigger = screen.getByRole("button", { name: "Open actions for Recent deck" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveTextContent("Recent deck");
    expect(dialog).toHaveTextContent("2 cards");
    expect(dialog).toHaveTextContent("in-progress study session");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.deleteDeck).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    await waitFor(() => expect(mocks.deleteDeck).toHaveBeenCalledExactlyOnceWith("user-id", recentDeck.id));
    expect(screen.getByRole("status")).toHaveTextContent("Deleted deck “Recent deck”.");
  });

  it("keeps the deletion target available for retry after failure", async () => {
    mocks.deleteDeck.mockRejectedValueOnce(new Error("delete failed"));
    renderDeckList();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Recent deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    expect(await screen.findByText("Unable to delete this deck. Check your connection and try again.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument());
  });
});
