/**
 * @file Verifies the Deck List presentation contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the page count,
 * both compact sections", "omits empty sections", "opens one deck actions menu at a time".
 */

import { fireEvent, render, within, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { getI18n } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

import { DeckList, type DeckListProps } from "./DeckList";

const activeDeck = createDeck({ id: "active", name: "Active deck", category: "math" });
const otherDeck = createDeck({ id: "other", name: "Other deck", category: "history" });
const onCreateDeck = () => undefined;
const onImportDeck = () => undefined;

const sections = {
  studying: [
    {
      deck: activeDeck,
      cardCount: 10,
      studySession: {
        sessionId: "active-session",
        deckId: activeDeck.id,
        cardOrderIds: ["card-1", "card-2", "card-3", "card-4"],
        currentIndex: 1,
        lastStudiedAt: Date.now(),
      },
    },
  ],
  other: [{ deck: otherDeck, cardCount: 7 }],
} satisfies DeckListProps["sections"];

describe("SETTINGS-04 DECK-NAVIGATION-01 DeckList", () => {
  it("renders the page count and both compact sections", () => {
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeInTheDocument();
    expect(screen.getByText("2 decks")).toBeInTheDocument();

    const studying = screen.getByRole("region", { name: "Studying" });
    expect(within(studying).getByText("1 deck · recent first")).toBeInTheDocument();
    expect(within(studying).getByText(activeDeck.name)).toBeInTheDocument();

    const other = screen.getByRole("region", { name: "Other decks" });
    expect(within(other).getByText("1 deck · A–Z")).toBeInTheDocument();
    expect(within(other).getByText(otherDeck.name)).toBeInTheDocument();
  });

  it("omits empty sections", () => {
    render(
      <DeckList
        sections={{ studying: [], other: sections.other }}
        onCreateDeck={onCreateDeck}
        onImportDeck={onImportDeck}
      />
    );

    expect(screen.queryByRole("region", { name: "Studying" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Other decks" })).toBeInTheDocument();
  });

  it("opens one deck actions menu at a time", () => {
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Active deck" }));
    expect(screen.getByRole("menu", { name: "Actions for Active deck" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Other deck" }));
    expect(screen.queryByRole("menu", { name: "Actions for Active deck" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Actions for Other deck" })).toBeInTheDocument();
  });

  it("keeps the list and deck menus mutually exclusive", async () => {
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Active deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Actions" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Other deck" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Actions for Other deck" })).toBeVisible();
  });

  it("reports create and import intents and closes the list menu", async () => {
    const create = vi.fn();
    const importDeck = vi.fn();
    render(<DeckList sections={sections} onCreateDeck={create} onImportDeck={importDeck} />);
    const trigger = screen.getByRole("button", { name: "Actions" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Create deck" }));
    expect(create).toHaveBeenCalledExactlyOnceWith();
    expect(importDeck).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Import decks" }));
    expect(importDeck).toHaveBeenCalledExactlyOnceWith();
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports keyboard selection and Escape without executing an action", async () => {
    const create = vi.fn();
    const importDeck = vi.fn();
    render(<DeckList sections={sections} onCreateDeck={create} onImportDeck={importDeck} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Create deck" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Import decks" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(create).not.toHaveBeenCalled();
    expect(importDeck).not.toHaveBeenCalled();
  });

  it("keeps list actions available without introducing an empty-state message", async () => {
    render(<DeckList sections={{ studying: [], other: [] }} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    expect(screen.getByText("0 decks")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText(/no decks/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
  });

  it("localizes fixed copy without translating user-created deck names", async () => {
    await getI18n().changeLanguage("ja");
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    expect(screen.getByRole("heading", { level: 1, name: "デッキ" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "アクション" }));
    expect(screen.getByRole("menuitem", { name: "デッキを作成" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "デッキをインポート" })).toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "学習中" })).toHaveTextContent(activeDeck.name);
    expect(screen.getByRole("region", { name: "その他のデッキ" })).toHaveTextContent(otherDeck.name);
    expect(screen.getByRole("button", { name: `${activeDeck.name}の操作を開く` })).toBeInTheDocument();
  });
});
