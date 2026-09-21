import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getI18n } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { actAsync } from "@/test/act";
import { createDeck } from "@/test/factories";

import { DeckList, type DeckListProps } from "./DeckList";

const nextDueAt = Date.UTC(2026, 0, 2);
const sections: DeckListProps["sections"] = {
  studying: [
    {
      deck: createDeck({ id: "active", name: "Active" }),
      cardCount: 4,
      studySession: {
        sessionId: "session-active",
        deckId: "active",
        cardOrderIds: ["a", "b"],
        currentIndex: 0,
        lastStudiedAt: 0,
        remote: { uid: "user-id", startedAt: 0 },
      },
      review: { dueCardCount: 0, newCardCount: 0, nextDueAt },
    },
  ],
  reviewNow: [
    {
      deck: createDeck({ id: "due", name: "Due" }),
      cardCount: 8,
      review: { dueCardCount: 3, newCardCount: 1, nextDueAt: undefined },
    },
    {
      deck: createDeck({ id: "new", name: "New" }),
      cardCount: 2,
      review: { dueCardCount: 0, newCardCount: 2, nextDueAt: undefined },
    },
  ],
  other: [
    {
      deck: createDeck({ id: "empty", name: "Empty" }),
      cardCount: 0,
      review: { dueCardCount: 0, newCardCount: 0, nextDueAt: undefined },
    },
    {
      deck: createDeck({ id: "filtered", name: "Filtered" }),
      cardCount: 2,
      review: { dueCardCount: 0, newCardCount: 0, nextDueAt: undefined },
    },
    {
      deck: createDeck({ id: "future", name: "Future" }),
      cardCount: 2,
      review: { dueCardCount: 0, newCardCount: 0, nextDueAt },
    },
  ],
  reviewSummary: { dueCardCount: 3, newCardCount: 3 },
};

describe("DECK-NAVIGATION-12 Deck review presentation", () => {
  it("shows a scoped summary, separate session progress and distinct empty reasons", async () => {
    const onClickStudy = vi.fn();
    const onClickContinue = vi.fn();
    render(
      <DeckList
        sections={sections}
        deckCard={{ onClickStudy, onClickContinue }}
        onCreateDeck={vi.fn()}
        onImportDeck={vi.fn()}
      />
    );
    const summary = within(screen.getByRole("region", { name: "Review summary" }));
    expect(summary.getByText("Due now: 3")).toBeVisible();
    expect(summary.getByText("New: 3")).toBeVisible();
    expect(summary.getByText(/currently available on this device/)).toBeVisible();
    expect(screen.getByText("6 decks")).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    const studying = within(screen.getByRole("region", { name: "Studying" }));
    expect(studying.getByRole("button", { name: "Continue Active" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Progress for Active" })).toHaveAttribute("aria-valuemax", "2");
    expect(screen.getByText("No cards on this device.")).toBeVisible();
    expect(screen.getByText("No cards match the saved filters.")).toBeVisible();
    expect(screen.getAllByText(/^Next review:/)).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Review Due" }));
    await userEvent.click(screen.getByRole("button", { name: "Study new cards in New" }));
    await userEvent.click(screen.getByRole("button", { name: "Continue Active" }));
    expect(onClickStudy.mock.calls).toEqual([["due"], ["new"]]);
    expect(onClickContinue).toHaveBeenCalledWith("active");
  });

  it("updates the added copy and dates when the language changes", async () => {
    render(<DeckList sections={sections} onCreateDeck={vi.fn()} onImportDeck={vi.fn()} />);
    await actAsync(() => getI18n().changeLanguage("ja"));
    const summary = within(screen.getByRole("region", { name: "復習の件数" }));
    expect(summary.getByText("復習対象: 3")).toBeVisible();
    expect(summary.getByText("新規: 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Dueを復習" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Newの新規カードを学習" })).toBeVisible();
    const time = new Intl.DateTimeFormat("ja", { dateStyle: "medium", timeStyle: "short" }).format(nextDueAt);
    expect(screen.getAllByText(`次回の復習: ${time}`)).toHaveLength(2);
  });

  it("keeps the old presentation without review data and hides empty section headings", () => {
    render(
      <DeckList
        sections={{ studying: [], other: [{ deck: createDeck({ name: "Plain" }), cardCount: 2 }] }}
        onCreateDeck={vi.fn()}
        onImportDeck={vi.fn()}
      />
    );
    expect(screen.queryByRole("region", { name: "Review summary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Review now" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Studying" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Study Plain" })).toBeVisible();
    expect(screen.getByText("2 cards")).toBeVisible();
  });
});
