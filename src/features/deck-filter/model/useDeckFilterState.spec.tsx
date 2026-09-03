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

type EditDeck = typeof import("@/entities/deck").editDeck;

const writeControls = vi.hoisted(() => ({
  calls: [] as Parameters<EditDeck>[],
  write: undefined as ((...args: Parameters<EditDeck>) => Promise<void>) | undefined,
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    editDeck: (...args: Parameters<typeof actual.editDeck>) => {
      writeControls.calls.push(args);
      return writeControls.write === undefined ? actual.editDeck(...args) : writeControls.write(...args);
    },
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

describe("DeckFilterForm with useDeckFilterState [CARD-10]", () => {
  const deckId = "filter-deck";
  const tags = ["tag1", "tag2", "tag3"];

  beforeEach(() => {
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("follows saved Deck subscription updates during the same mount", () => {
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("1");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 2, updatedAt: 2 }} tags={tags} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");
  });

  it("keeps an optimistic value until the next subscription update arrives", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 2 },
    });
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    await Promise.resolve(
      act(async () => {
        finishWrite();
        await Promise.resolve();
      })
    );
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    view.rerender(
      <DeckFilterHarness deck={{ ...remoteDeck, name: "Updated elsewhere", tagAndFilter: true }} tags={tags} />
    );
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 2, updatedAt: 3 }} tags={tags} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 3, updatedAt: 4 }} tags={tags} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("3");
  });

  it("accepts a newer authoritative value after a successful write", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 2 },
    });
    await Promise.resolve(act(async () => finishWrite()));

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 3, updatedAt: 2 }} tags={tags} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("3");
  });

  it("accepts an authoritative value observed before the write succeeds", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 2 },
    });
    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 3, updatedAt: 2 }} tags={tags} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    await Promise.resolve(act(async () => finishWrite()));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("3");
  });

  it("falls back to the latest saved value when an optimistic write fails", async () => {
    let failWrite: (error: Error) => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((_resolve, reject) => {
        failWrite = reject;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 2 },
    });
    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 3, updatedAt: 2 }} tags={tags} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("2");

    await Promise.resolve(act(async () => failWrite(new Error("write failed"))));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("3");
  });

  it("clears and rolls back both difficulty limits as one optimistic write", async () => {
    let failWrite: (error: Error) => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((_resolve, reject) => {
        failWrite = reject;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 8, difficultyMin: 3, updatedAt: 1 });
    render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("1");
    expect(writeControls.calls).toEqual([["user-id", { id: deckId, difficultyMax: 10, difficultyMin: 1 }]]);

    await Promise.resolve(act(async () => failWrite(new Error("write failed"))));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("8");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("3");
  });

  it("settles the whole clear action when a subscription changes one difficulty boundary", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 8, difficultyMin: 3, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));
    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: null, updatedAt: 2 }} tags={tags} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("1");

    await Promise.resolve(act(async () => finishWrite()));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("3");
  });

  it("keeps a newer individual difficulty choice when an older clear fails", async () => {
    const writes: Array<{ reject: (error: Error) => void; resolve: () => void }> = [];
    writeControls.write = () =>
      new Promise<void>((resolve, reject) => {
        writes.push({ reject, resolve });
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 8, difficultyMin: 3, updatedAt: 1 });
    render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Minimum difficulty" }), "4");
    await Promise.resolve(act(async () => writes[0]?.reject(new Error("clear failed"))));

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("8");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("4");
  });

  it("ignores an older response after a newer filter change", async () => {
    const writes: Array<{ reject: (error: Error) => void; resolve: () => void }> = [];
    writeControls.write = () =>
      new Promise<void>((resolve, reject) => {
        writes.push({ reject, resolve });
      });
    const remoteDeck = createRemoteDeck({ id: deckId, difficultyMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={remoteDeck} tags={tags} />);

    const difficultyMax = screen.getByRole("combobox", { name: "Maximum difficulty" });
    fireEvent.change(difficultyMax, { target: { value: 2 } });
    fireEvent.change(difficultyMax, { target: { value: 3 } });
    expect(difficultyMax).toHaveValue("3");

    await Promise.resolve(act(async () => writes[0]?.reject(new Error("older write failed"))));
    expect(difficultyMax).toHaveValue("3");

    view.rerender(<DeckFilterHarness deck={{ ...remoteDeck, difficultyMax: 2, updatedAt: 2 }} tags={tags} />);
    await Promise.resolve(act(async () => writes[1]?.reject(new Error("latest write failed"))));

    expect(difficultyMax).toHaveValue("2");
  });

  it("restores difficulty and tag mode changes from the saved Deck", async () => {
    await createDeck(
      "",
      createLocalDeck({ id: deckId, difficultyMax: 8, difficultyMin: 3, tagAndFilter: false, selectedTags: [] })
    );
    const renderFilter = () => render(<StoredDeckFilterHarness deckId={deckId} tags={tags} />);
    const view = renderFilter();

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 7 },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Minimum difficulty" }), {
      target: { value: 4 },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));

    view.unmount();
    renderFilter();

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("7");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("4");
    expect(screen.getByRole("checkbox", { name: "Match all selected tags" })).toBeChecked();
    expect(screen.getByText("AND")).toBeInTheDocument();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).toBeChecked();
  });

  it("restores difficulty limits and later restores their removal", async () => {
    await createDeck("", createLocalDeck({ id: deckId, difficultyMax: null, difficultyMin: null }));
    const renderFilter = () => render(<StoredDeckFilterHarness deckId={deckId} tags={tags} />);
    let view = renderFilter();

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum difficulty" }), {
      target: { value: 8 },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Minimum difficulty" }), {
      target: { value: 3 },
    });

    view.unmount();
    view = renderFilter();

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("8");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("3");

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));

    view.unmount();
    renderFilter();

    expect(screen.queryByRole("button", { name: "Clear limits" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("1");
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

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    view.unmount();
    renderFilter();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).not.toBeChecked();
  });
});
