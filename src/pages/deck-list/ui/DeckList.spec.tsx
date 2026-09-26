/**
 * @file Verifies the Deck List presentation contract with automated examples.
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
        remote: { uid: "uid", startedAt: 0 },
      },
    },
  ],
  other: [{ deck: otherDeck, cardCount: 7 }],
} satisfies DeckListProps["sections"];

describe("SETTINGS-04 NAVIGATION-06 NAVIGATION-17 DeckList", () => {
  it("groups active decks before other decks with visible headings", () => {
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeInTheDocument();
    expect(screen.getByText("2 decks")).toBeInTheDocument();

    const list = screen.getByRole("region", { name: "Decks" });
    expect(within(list).getAllByRole("article")).toHaveLength(2);
    expect(within(list).getAllByRole("article")[0]).toHaveAccessibleName(activeDeck.name);
    expect(within(list).getAllByRole("article")[1]).toHaveAccessibleName(otherDeck.name);
    expect(within(list).getByRole("heading", { name: "Studying 1 deck" })).toBeVisible();
    expect(within(list).getByRole("heading", { name: "Other decks 1 deck" })).toBeVisible();
    expect(within(list).queryByRole("region", { name: "Ready to study" })).not.toBeInTheDocument();
  });

  it("keeps inactive decks available and omits empty groups", () => {
    render(
      <DeckList
        sections={{ studying: [], other: sections.other }}
        onCreateDeck={onCreateDeck}
        onImportDeck={onImportDeck}
      />
    );

    expect(screen.getByRole("article", { name: otherDeck.name })).toBeVisible();
    expect(screen.getByRole("region", { name: "Other decks" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Studying" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Ready to study" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue Active deck" })).not.toBeInTheDocument();
  });

  it("shows ready decks between studying and other decks", () => {
    const readyDeck = createDeck({ id: "ready", name: "Ready deck" });
    render(
      <DeckList
        sections={{
          ...sections,
          reviewNow: [{ deck: readyDeck, cardCount: 3, review: { due: 2, new: 1, nextDueAt: undefined } }],
        }}
        onCreateDeck={onCreateDeck}
        onImportDeck={onImportDeck}
      />
    );
    const list = screen.getByRole("region", { name: "Decks" });
    expect(
      within(list)
        .getAllByRole("region")
        .map((region) => region.getAttribute("aria-label"))
    ).toEqual(["Studying", "Ready to study", "Other decks"]);
    const readyGroup = screen.getByRole("region", { name: "Ready to study" });
    expect(within(readyGroup).getByRole("article", { name: readyDeck.name })).toBeVisible();
    expect(within(readyGroup).getByRole("button", { name: "Review Ready deck" })).toBeVisible();
    expect(within(list).getAllByRole("article")).toHaveLength(3);
  });

  it.each(["button", "menuitem"] as const)(
    "closes the mobile sheet through its %s without running an action",
    async (role) => {
      const create = vi.fn();
      const importDeck = vi.fn();
      render(<DeckList sections={sections} onCreateDeck={create} onImportDeck={importDeck} />);
      const trigger = screen.getByRole("button", { name: "Add" });
      await userEvent.click(trigger);
      await userEvent.click(screen.getByRole(role, { name: "Close menu" }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(create).not.toHaveBeenCalled();
      expect(importDeck).not.toHaveBeenCalled();
    }
  );

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
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Add" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Other deck" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Actions for Other deck" })).toBeVisible();
  });

  it("reports create and import intents and closes the list menu", async () => {
    const create = vi.fn();
    const importDeck = vi.fn();
    render(<DeckList sections={sections} onCreateDeck={create} onImportDeck={importDeck} />);
    const trigger = screen.getByRole("button", { name: "Add" });

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
    const trigger = screen.getByRole("button", { name: "Add" });
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

  it("keeps list actions available when empty", async () => {
    render(
      <DeckList
        sections={{ studying: [], other: [] }}
        empty={{
          reason: "confirmed-empty",
        }}
        onCreateDeck={onCreateDeck}
        onImportDeck={onImportDeck}
      />
    );

    expect(screen.getByText("0 decks")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "No decks yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create deck" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import decks" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
  });

  it("renders checking status without confirmed empty guidance", () => {
    render(
      <DeckList
        sections={{ studying: [], other: [] }}
        empty={{
          reason: "checking",
        }}
        onCreateDeck={onCreateDeck}
        onImportDeck={onImportDeck}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Checking for sample deck…");
    expect(screen.queryByRole("heading", { name: "No decks yet" })).not.toBeInTheDocument();
  });

  it("renders bootstrap error with Retry, Create deck, and Import actions", async () => {
    const onRetry = vi.fn();
    const create = vi.fn();
    const importDeck = vi.fn();
    render(
      <DeckList
        sections={{ studying: [], other: [] }}
        empty={{
          reason: "error",
          onRetry,
        }}
        onCreateDeck={create}
        onImportDeck={importDeck}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Unable to load sample deck" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    expect(create).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Import decks" }));
    expect(importDeck).toHaveBeenCalledTimes(1);
  });

  it("localizes fixed copy without translating user-created deck names", async () => {
    await getI18n().changeLanguage("ja");
    render(<DeckList sections={sections} onCreateDeck={onCreateDeck} onImportDeck={onImportDeck} />);

    expect(screen.getByRole("heading", { level: 1, name: "デッキ" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByRole("menuitem", { name: "デッキを作成" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "デッキをインポート" })).toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "デッキ" })).toHaveTextContent(activeDeck.name);
    expect(screen.getByRole("article", { name: otherDeck.name })).toBeVisible();
    expect(screen.getByRole("button", { name: `${activeDeck.name}の操作を開く` })).toBeInTheDocument();
  });
});
