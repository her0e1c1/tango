/**
 * @file Verifies the "DeckFilterForm with useDeckFilterState" contract with automated examples.
 * The examples make the expected behavior concrete by remounting the form from its saved Deck.
 */

import type { Deck, DeckId } from "@/entities/deck";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck, useDeck } from "@/entities/deck";
import { createDeck as createRemoteDeck, createLocalDeck } from "@/test/factories";
import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterState } from "./useDeckFilterState";

const writeControls = vi.hoisted(() => ({
  write: undefined as (() => Promise<void>) | undefined,
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    editDeck: (...args: Parameters<typeof actual.editDeck>) =>
      writeControls.write === undefined ? actual.editDeck(...args) : writeControls.write(),
  };
});

/**
 * Renders the test-only Deck Filter Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const DeckFilterHarness: React.FC<{
  deck: Deck;
  tags: string[];
}> = ({ deck, tags }) => {
  const deckFilter = useDeckFilterState(deck);
  return <DeckFilterForm {...deckFilter} tags={tags} />;
};

// Connects a fresh filter form to the Deck saved by the Entity after each remount.
const StoredDeckFilterHarness: React.FC<{ deckId: DeckId; tags: string[] }> = ({ deckId, tags }) => {
  const deck = useDeck(deckId);
  return deck === undefined ? null : <DeckFilterHarness deck={deck} tags={tags} />;
};

describe("DeckFilterForm with useDeckFilterState", () => {
  const deckId = "filter-deck";
  const tags = ["tag1", "tag2", "tag3"];

  beforeEach(() => {
    writeControls.write = undefined;
  });

  it("follows saved Deck subscription updates during the same mount", () => {
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("1");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 2, updatedAt: 2 }} tags={tags} />);

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");
  });

  it("keeps an optimistic value until the next subscription update arrives", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    await Promise.resolve(
      act(async () => {
        finishWrite();
        await Promise.resolve();
      })
    );
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    view.rerender(
      <DeckFilterHarness deck={{ ...remoteDeck, name: "Updated elsewhere", tagAndFilter: true }} tags={tags} />
    );
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 2, updatedAt: 3 }} tags={tags} />);
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 3, updatedAt: 4 }} tags={tags} />);

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("3");
  });

  it("accepts a newer authoritative value after a successful write", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    await Promise.resolve(act(async () => finishWrite()));

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 3, updatedAt: 2 }} tags={tags} />);

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("3");
  });

  it("accepts an authoritative value observed before the write succeeds", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 3, updatedAt: 2 }} tags={tags} />);
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    await Promise.resolve(act(async () => finishWrite()));

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("3");
  });

  it("falls back to the latest saved value when an optimistic write fails", async () => {
    let failWrite: (error: Error) => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((_resolve, reject) => {
        failWrite = reject;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 3, updatedAt: 2 }} tags={tags} />);
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");

    await Promise.resolve(act(async () => failWrite(new Error("write failed"))));

    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("3");
  });

  it("ignores an older response after a newer filter change", async () => {
    const writes: Array<{ reject: (error: Error) => void; resolve: () => void }> = [];
    writeControls.write = () =>
      new Promise<void>((resolve, reject) => {
        writes.push({ reject, resolve });
      });
    const remoteDeck = createRemoteDeck({ id: deckId, scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    const scoreMax = screen.getByRole("slider", { name: "Maximum score value" });
    fireEvent.change(scoreMax, { target: { value: 2 } });
    fireEvent.change(scoreMax, { target: { value: 3 } });
    expect(scoreMax).toHaveValue("3");

    await Promise.resolve(act(async () => writes[0]?.reject(new Error("older write failed"))));
    expect(scoreMax).toHaveValue("3");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, scoreMax: 2, updatedAt: 2 }} tags={tags} />);
    await Promise.resolve(act(async () => writes[1]?.reject(new Error("latest write failed"))));

    expect(scoreMax).toHaveValue("2");
  });

  it("restores score and tag mode changes from the saved Deck", async () => {
    await createDeck(
      "",
      createLocalDeck({ id: deckId, scoreMax: 1, scoreMin: -1, tagAndFilter: false, selectedTags: [] })
    );
    const renderFilter = () => render(<StoredDeckFilterHarness deckId={deckId} tags={tags} />);
    const view = renderFilter();

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));

    view.unmount();
    renderFilter();

    expect(screen.getByText("−2 to 2")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toHaveValue("-2");
    expect(screen.getByRole("checkbox", { name: "Match all selected tags" })).toBeChecked();
    expect(screen.getByText("AND")).toBeInTheDocument();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).toBeChecked();
  });

  it("restores enabled score limits and later restores their removal", async () => {
    await createDeck("", createLocalDeck({ id: deckId, scoreMax: null, scoreMin: null }));
    const renderFilter = () => render(<StoredDeckFilterHarness deckId={deckId} tags={tags} />);
    let view = renderFilter();

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });

    view.unmount();
    view = renderFilter();

    expect(screen.getByText("−2 to 2")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enable maximum score" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Enable minimum score" })).toBeChecked();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toHaveValue("-2");

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));

    view.unmount();
    renderFilter();

    expect(screen.getByText("Any score")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enable maximum score" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Enable minimum score" })).not.toBeChecked();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toBeDisabled();
  });

  it("restores individual, all, and cleared tag selections", async () => {
    await createDeck("", createLocalDeck({ id: deckId, selectedTags: [] }));
    const renderFilter = () => render(<StoredDeckFilterHarness deckId={deckId} tags={tags} />);
    let view = renderFilter();

    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    view.unmount();
    view = renderFilter();
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag3" })).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    view.unmount();
    view = renderFilter();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    view.unmount();
    renderFilter();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).not.toBeChecked();
  });
});
