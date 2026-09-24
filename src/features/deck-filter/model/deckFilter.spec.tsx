import { getAuthUid } from "@/entities/auth";
import type React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { actAsync } from "@/test/act";
import { replaceRemoteDecks } from "@/test/entityFixtures";

import type { Deck } from "@/entities/deck";
import { createDeck as buildRemoteDeck } from "@/test/factories";

import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterDraft } from "./useDeckFilterDraft";
import { getDeckFilterState } from "./queries/getDeckFilterState";
import { useDeckFilterSaveLifecycle } from "./useDeckFilterSaveLifecycle";
import type { DeckFilterScope } from "./types";
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

const createRemoteDeck = (...args: Parameters<typeof buildRemoteDeck>): Deck => {
  const deck = buildRemoteDeck(...args);
  replaceRemoteDecks([deck]);
  return deck;
};

const DeckFilterHarness: React.FC<{ deck: Deck; tags?: string[]; scope?: DeckFilterScope }> = ({
  deck,
  tags = ["tag1", "tag2"],
  scope = "study",
}) => {
  const uid = getAuthUid();
  const filterDraft = useDeckFilterDraft(uid, deck, scope);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = {
    scope,
    uid,
    deckId: deck.id,
    draft: filterDraft.state.draft,
    setState: filterDraft.setState,
  };
  const filter = getDeckFilterState(filterDraft.state);
  return (
    <DeckFilterForm
      {...filter}
      setSelectedTags={(selectedTags) => updateDeckFilterDraft({ selectedTags }, filterUpdate)}
      setTagAndFilter={(tagAndFilter) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate)}
      tags={tags}
    />
  );
};

describe("CARD-LIST-ACTIONS-01 STUDY-SESSION-08 DeckFilterForm with individual draft and save actions", () => {
  beforeEach(() => {
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("automatically saves each change without a save button", async () => {
    const deck = createRemoteDeck({ id: "filter-deck", selectedTags: [] });
    render(<DeckFilterHarness deck={deck} />);

    expect(writeControls.calls).toEqual([]);
    expect(screen.queryByRole("button", { name: "Save filters" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ selectedTags: ["tag1"] });
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    expect(writeControls.calls.at(-1)?.[1]).toEqual({
      id: "filter-deck",
      selectedTags: ["tag1", "tag2"],
      tagAndFilter: false,
    });
  });

  it("keeps controls editable and persists rapid changes in order", async () => {
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      if (value.selectedTags?.includes("tag1") && !value.selectedTags?.includes("tag2")) await firstWrite.promise;
      persisted = value;
    };
    render(<DeckFilterHarness deck={createRemoteDeck({ id: "filter-deck", selectedTags: [] })} />);
    const maximum = screen.getByRole("checkbox", { name: "tag1" });
    await userEvent.click(maximum);
    expect(maximum).toBeEnabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    await userEvent.click(maximum);
    expect(maximum).not.toBeChecked();
    expect(persisted).toBeUndefined();
    await actAsync(async () => firstWrite.resolve());
    await waitFor(() => expect(persisted).toMatchObject({ selectedTags: ["tag2"] }));
  });

  it("preserves pending selections and write order when moving to another Page", async () => {
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      await firstWrite.promise;
      persisted = value;
    };
    const deck = createRemoteDeck({ id: "navigation-deck", selectedTags: [] });
    const view = render(<DeckFilterHarness deck={deck} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    view.unmount();

    render(<DeckFilterHarness deck={deck} />);
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await actAsync(async () => firstWrite.resolve());
    await waitFor(() => expect(persisted).toMatchObject({ selectedTags: ["tag2"] }));
  });

  it("retains a save that fails after leaving the Page and retries all filters on the next visit", async () => {
    const failedWrite = Promise.withResolvers<void>();
    writeControls.write = vi.fn().mockReturnValueOnce(failedWrite.promise).mockResolvedValueOnce(undefined);
    const deck = createRemoteDeck({ id: "failed-navigation-deck" });
    const view = render(<DeckFilterHarness deck={deck} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    view.unmount();
    await actAsync(async () => failedWrite.reject(new Error("failed")));

    render(<DeckFilterHarness deck={deck} />);
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ selectedTags: ["tag1", "tag2"] });
  });

  it("keeps the opening snapshot when the same Deck subscription changes", () => {
    const deck = createRemoteDeck({ id: "filter-deck", selectedTags: ["tag1"], updatedAt: 1 });
    const view = render(<DeckFilterHarness deck={deck} />);

    view.rerender(<DeckFilterHarness deck={{ ...deck, selectedTags: ["tag2"], updatedAt: 2 }} />);

    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
  });

  it("starts from the new snapshot when the Deck id changes", () => {
    const view = render(<DeckFilterHarness deck={createRemoteDeck({ id: "first", selectedTags: ["tag1"] })} />);

    view.rerender(<DeckFilterHarness deck={createRemoteDeck({ id: "second", selectedTags: ["tag2"] })} />);

    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
  });
});

describe("CARD-FILTER-01 CARD-FILTER-05 browsing drafts", () => {
  beforeEach(() => {
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("keeps browsing saves across page changes without leaking them into study filters", async () => {
    const write = Promise.withResolvers<void>();
    writeControls.write = () => write.promise;
    const deck = createRemoteDeck({ id: "browse-pending", selectedTags: ["tag2"], tagAndFilter: true });
    const { unmount: unmountList } = render(<DeckFilterHarness deck={deck} scope="card" />);
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    unmountList();
    const { unmount: unmountStudy } = render(<DeckFilterHarness deck={deck} />);
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    unmountStudy();
    render(<DeckFilterHarness deck={deck} scope="card" />);
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await actAsync(async () => write.resolve());
    await waitFor(() =>
      expect(writeControls.calls.at(-1)?.[1]).toEqual({
        id: deck.id,
        cardFilter: { selectedTags: ["tag2"], tagAndFilter: false },
      })
    );
  });

  it("follows saved browsing changes and clearing without copying study conditions", () => {
    const deck = createRemoteDeck({ id: "browse-live", selectedTags: ["tag2"], tagAndFilter: true });
    const view = render(<DeckFilterHarness deck={deck} scope="card" />);
    expect(screen.getByRole("radio", { name: "Any" })).toBeChecked();
    view.rerender(
      <DeckFilterHarness deck={{ ...deck, cardFilter: { selectedTags: ["tag1"], tagAndFilter: true } }} scope="card" />
    );
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
    view.rerender(
      <DeckFilterHarness deck={{ ...deck, cardFilter: { selectedTags: [], tagAndFilter: false } }} scope="card" />
    );
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Any" })).toBeChecked();
  });
});
