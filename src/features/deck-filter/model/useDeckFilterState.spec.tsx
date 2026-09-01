import type React from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { Deck } from "@/entities/deck";
import { createDeck as createRemoteDeck } from "@/test/factories";

import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterState } from "./useDeckFilterState";

type EditDeck = typeof import("@/entities/deck").editDeck;

const writeControls = vi.hoisted(() => ({
  calls: [] as Parameters<EditDeck>[],
  write: undefined as ((...args: Parameters<EditDeck>) => Promise<void>) | undefined,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    editDeck: (...args: Parameters<typeof actual.editDeck>) => {
      writeControls.calls.push(args);
      return writeControls.write?.(...args) ?? Promise.resolve();
    },
  };
});

const DeckFilterHarness: React.FC<{ deck: Deck; tags?: string[] }> = ({ deck, tags = ["tag1", "tag2"] }) => {
  const filter = useDeckFilterState(deck);
  return <DeckFilterForm {...filter} tags={tags} />;
};

describe("CARD-10 SWIPE-26 DeckFilterForm with useDeckFilterState", () => {
  beforeEach(() => {
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("previews filter changes without writing until Save filters is selected", async () => {
    const deck = createRemoteDeck({ id: "filter-deck", scoreMax: 1, scoreMin: -1, selectedTags: [] });
    render(<DeckFilterHarness deck={deck} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum score" }), { target: { value: 2 } });
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));

    expect(writeControls.calls).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Save filters" }));

    expect(writeControls.calls).toEqual([
      [
        "user-id",
        {
          id: "filter-deck",
          scoreMax: 2,
          scoreMin: -1,
          selectedTags: ["tag2"],
          tagAndFilter: false,
        },
      ],
    ]);
  });

  it("disables all filter controls and prevents a duplicate save while writing", async () => {
    let finishWrite: () => void = () => undefined;
    writeControls.write = () =>
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
    render(<DeckFilterHarness deck={createRemoteDeck({ id: "filter-deck", scoreMax: 1 })} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum score" }), { target: { value: 2 } });
    const save = screen.getByRole("button", { name: "Save filters" });
    await userEvent.click(save);

    expect(save).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Maximum score" })).toBeDisabled();
    fireEvent.click(save);
    expect(writeControls.calls).toHaveLength(1);

    act(() => finishWrite());
    await waitFor(() => expect(save).toBeDisabled());
  });

  it("keeps a failed draft and saves it on the next explicit attempt", async () => {
    writeControls.write = vi.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValueOnce(undefined);
    render(<DeckFilterHarness deck={createRemoteDeck({ id: "filter-deck", scoreMax: 1 })} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Maximum score" }), { target: { value: 3 } });
    const save = screen.getByRole("button", { name: "Save filters" });
    await userEvent.click(save);

    expect(screen.getByRole("combobox", { name: "Maximum score" })).toHaveValue("3");
    expect(save).toBeEnabled();

    await userEvent.click(save);
    expect(writeControls.calls).toHaveLength(2);
    expect(writeControls.calls[1]?.[1]).toMatchObject({ scoreMax: 3 });
  });

  it("keeps the opening snapshot when the same Deck subscription changes", () => {
    const deck = createRemoteDeck({ id: "filter-deck", scoreMax: 1, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={deck} />);

    view.rerender(<DeckFilterHarness deck={{ ...deck, scoreMax: 4, updatedAt: 2 }} />);

    expect(screen.getByRole("combobox", { name: "Maximum score" })).toHaveValue("1");
  });

  it("starts from the new snapshot when the Deck id changes", () => {
    const view = render(<DeckFilterHarness deck={createRemoteDeck({ id: "first", scoreMax: 1 })} />);

    view.rerender(<DeckFilterHarness deck={createRemoteDeck({ id: "second", scoreMax: 4 })} />);

    expect(screen.getByRole("combobox", { name: "Maximum score" })).toHaveValue("4");
  });
});
