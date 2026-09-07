import { getAuthUid } from "@/entities/auth";
import type React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { actAsync } from "@/test/act";

import type { Deck } from "@/entities/deck";
import { createDeck as createRemoteDeck } from "@/test/factories";

import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterDraft } from "./useDeckFilterDraft";
import { getDeckFilterState } from "./queries/getDeckFilterState";
import { clearDeckFilterRange } from "./actions/clearDeckFilterRange";
import { useDeckFilterSaveLifecycle } from "./useDeckFilterSaveLifecycle";
import { updateDeckFilterDraft } from "./actions/updateDeckFilterDraft";

type EditDeck = typeof import("@/entities/deck").editDeck;

const writeControls = vi.hoisted(() => ({
  calls: [] as Parameters<EditDeck>[],
  write: undefined as ((...args: Parameters<EditDeck>) => Promise<void>) | undefined,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id" }));
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
  const uid = getAuthUid();
  const filterDraft = useDeckFilterDraft(uid, deck);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = {
    uid,
    deckId: deck.id,
    draft: filterDraft.state.draft,
    setState: filterDraft.setState,
  };
  const filter = getDeckFilterState(filterDraft.state);
  return (
    <DeckFilterForm
      {...filter}
      clearDifficultyRange={() => clearDeckFilterRange(filterUpdate)}
      setDifficultyMax={(difficultyMax) => updateDeckFilterDraft({ difficultyMax }, filterUpdate)}
      setDifficultyMin={(difficultyMin) => updateDeckFilterDraft({ difficultyMin }, filterUpdate)}
      setSelectedTags={(selectedTags) => updateDeckFilterDraft({ selectedTags }, filterUpdate)}
      setTagAndFilter={(tagAndFilter) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate)}
      tags={tags}
    />
  );
};

describe("CARD-10 SWIPE-26 DeckFilterForm with individual draft and save actions", () => {
  beforeEach(() => {
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("automatically saves each change without a save button", async () => {
    const deck = createRemoteDeck({ id: "filter-deck", difficultyMax: 8, difficultyMin: 3, selectedTags: [] });
    render(<DeckFilterHarness deck={deck} />);

    expect(writeControls.calls).toEqual([]);
    expect(screen.queryByRole("button", { name: "Save filters" })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Maximum difficulty" }), "7");
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ difficultyMax: 7, selectedTags: [] });
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    expect(writeControls.calls.at(-1)?.[1]).toEqual({
      id: "filter-deck",
      difficultyMax: 7,
      difficultyMin: 3,
      selectedTags: ["tag2"],
      tagAndFilter: false,
    });
  });

  it("automatically saves explicit domain bounds when clearing difficulty filters", async () => {
    render(<DeckFilterHarness deck={createRemoteDeck({ id: "filter-deck", difficultyMax: 8, difficultyMin: 3 })} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("1");
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ difficultyMax: 10, difficultyMin: 1 });
  });

  it("keeps controls editable and persists rapid changes in order", async () => {
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      if (value.difficultyMax === 7 && value.selectedTags?.length === 0) await firstWrite.promise;
      persisted = value;
    };
    render(<DeckFilterHarness deck={createRemoteDeck({ id: "filter-deck", difficultyMax: 8, selectedTags: [] })} />);
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });
    await userEvent.selectOptions(maximum, "7");
    expect(maximum).toBeEnabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    await userEvent.selectOptions(maximum, "6");
    expect(maximum).toHaveValue("6");
    expect(persisted).toBeUndefined();
    await actAsync(async () => firstWrite.resolve());
    await waitFor(() => expect(persisted).toMatchObject({ difficultyMax: 6, selectedTags: ["tag2"] }));
  });

  it("preserves pending selections and write order when moving to another Page", async () => {
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      await firstWrite.promise;
      persisted = value;
    };
    const deck = createRemoteDeck({ id: "navigation-deck", difficultyMax: 8, selectedTags: [] });
    const view = render(<DeckFilterHarness deck={deck} />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Maximum difficulty" }), "7");
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    view.unmount();

    render(<DeckFilterHarness deck={deck} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("7");
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Maximum difficulty" }), "6");
    await actAsync(async () => firstWrite.resolve());
    await waitFor(() => expect(persisted).toMatchObject({ difficultyMax: 6, selectedTags: ["tag2"] }));
  });

  it("retains a save that fails after leaving the Page and retries all filters on the next visit", async () => {
    const failedWrite = Promise.withResolvers<void>();
    writeControls.write = vi.fn().mockReturnValueOnce(failedWrite.promise).mockResolvedValueOnce(undefined);
    const deck = createRemoteDeck({ id: "failed-navigation-deck", difficultyMax: 8 });
    const view = render(<DeckFilterHarness deck={deck} />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Maximum difficulty" }), "6");
    view.unmount();
    await actAsync(async () => failedWrite.reject(new Error("failed")));

    render(<DeckFilterHarness deck={deck} />);
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("6");
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ difficultyMax: 6, selectedTags: ["tag2"] });
  });

  it("keeps the opening snapshot when the same Deck subscription changes", () => {
    const deck = createRemoteDeck({ id: "filter-deck", difficultyMax: 8, updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={deck} />);

    view.rerender(<DeckFilterHarness deck={{ ...deck, difficultyMax: 4, updatedAt: 2 }} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("8");
  });

  it("starts from the new snapshot when the Deck id changes", () => {
    const view = render(<DeckFilterHarness deck={createRemoteDeck({ id: "first", difficultyMax: 8 })} />);

    view.rerender(<DeckFilterHarness deck={createRemoteDeck({ id: "second", difficultyMax: 4 })} />);

    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("4");
  });
});
