import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { getAuthUid } from "@/entities/auth";
import type React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { actAsync } from "@/test/act";
import { replaceRemoteDecks } from "@/test/utils/entityFixtures";

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
  uid: "user-id",
  calls: [] as Parameters<EditDeck>[],
  write: undefined as ((...args: Parameters<EditDeck>) => Promise<void>) | undefined,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => writeControls.uid }));
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

describe("CARD-LIST-ACTIONS-01 STUDY-SESSION-08 CARD-LIST-ACTIONS-05 CARD-LIST-ACTIONS-06 DeckFilterForm with individual draft and save actions", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    writeControls.uid = "user-id";
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("does not show a previous account's rejected filter save", async () => {
    // Given: Prepare `pending`, `deck` and any shared test state below.
    const pending = Promise.withResolvers<void>();
    writeControls.write = () => pending.promise;
    const deck = createRemoteDeck({
      id: "account-switch-filter",
      studyFilter: { selectedTags: [], tagAndFilter: false },
    });
    render(
      <>
        <DeckFilterHarness deck={deck} />
        <ToastViewport />
      </>
    );
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    writeControls.uid = "next-user";
    await actAsync(async () => {
      pending.reject(new Error("denied"));
      await pending.promise.catch(() => undefined);
    });
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("automatically saves each change without a save button", async () => {
    // Given: Prepare `deck` and any shared test state below.
    const deck = createRemoteDeck({ id: "filter-deck", studyFilter: { selectedTags: [], tagAndFilter: false } });
    render(<DeckFilterHarness deck={deck} />);

    expect(writeControls.calls).toEqual([]);
    expect(screen.queryByRole("button", { name: "Save filters" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    // Then: Verify the expected result in the assertions below.
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ studyFilter: { selectedTags: ["tag1"] } });
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    // Then: Verify the expected result in the assertions below.
    expect(writeControls.calls.at(-1)?.[1]).toEqual({
      id: "filter-deck",
      studyFilter: { selectedTags: ["tag1", "tag2"], tagAndFilter: false },
    });
  });

  it("keeps controls editable and persists rapid changes in order", async () => {
    // Given: Prepare `firstWrite`, `persisted`, `maximum` and any shared test state below.
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      if (value.studyFilter?.selectedTags?.includes("tag1") && !value.studyFilter?.selectedTags?.includes("tag2"))
        await firstWrite.promise;
      persisted = value;
    };
    render(
      <DeckFilterHarness
        deck={createRemoteDeck({ id: "filter-deck", studyFilter: { selectedTags: [], tagAndFilter: false } })}
      />
    );
    const maximum = screen.getByRole("checkbox", { name: "tag1" });
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(maximum);
    // Then: Verify the expected result in the assertions below.
    expect(maximum).toBeEnabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    await userEvent.click(maximum);
    // Then: Verify the expected result in the assertions below.
    expect(maximum).not.toBeChecked();
    expect(persisted).toBeUndefined();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => firstWrite.resolve());
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(persisted).toMatchObject({ studyFilter: { selectedTags: ["tag2"] } }));
  });

  it("preserves pending selections and write order when moving to another Page", async () => {
    // Given: Prepare `firstWrite`, `persisted`, `deck` and any shared test state below.
    const firstWrite = Promise.withResolvers<void>();
    let persisted: Parameters<EditDeck>[1] | undefined;
    writeControls.write = async (_uid, value) => {
      await firstWrite.promise;
      persisted = value;
    };
    const deck = createRemoteDeck({ id: "navigation-deck", studyFilter: { selectedTags: [], tagAndFilter: false } });
    const view = render(<DeckFilterHarness deck={deck} />);
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    view.unmount();

    render(<DeckFilterHarness deck={deck} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await actAsync(async () => firstWrite.resolve());
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(persisted).toMatchObject({ studyFilter: { selectedTags: ["tag2"] } }));
  });

  it("retains a save that fails after leaving the Page and retries all filters on the next visit", async () => {
    // Given: Prepare `failedWrite`, `deck`, `view` and any shared test state below.
    const failedWrite = Promise.withResolvers<void>();
    writeControls.write = vi.fn().mockReturnValueOnce(failedWrite.promise).mockResolvedValueOnce(undefined);
    const deck = createRemoteDeck({ id: "failed-navigation-deck" });
    const view = render(<DeckFilterHarness deck={deck} />);
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    view.unmount();
    await actAsync(async () => failedWrite.reject(new Error("failed")));

    render(<DeckFilterHarness deck={deck} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    // Then: Verify the expected result in the assertions below.
    expect(writeControls.calls.at(-1)?.[1]).toMatchObject({ studyFilter: { selectedTags: ["tag1", "tag2"] } });
  });

  it("keeps the opening snapshot when the same Deck subscription changes", () => {
    // Given: Prepare `deck`, `view` and any shared test state below.
    const deck = createRemoteDeck({
      id: "filter-deck",
      studyFilter: { selectedTags: ["tag1"], tagAndFilter: false },
      updatedAt: 1,
    });
    const view = render(<DeckFilterHarness deck={deck} />);

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <DeckFilterHarness
        deck={{ ...deck, studyFilter: { selectedTags: ["tag2"], tagAndFilter: false }, updatedAt: 2 }}
      />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
  });

  it("starts from the new snapshot when the Deck id changes", () => {
    // Given: Prepare `view` and any shared test state below.
    const view = render(
      <DeckFilterHarness
        deck={createRemoteDeck({ id: "first", studyFilter: { selectedTags: ["tag1"], tagAndFilter: false } })}
      />
    );

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <DeckFilterHarness
        deck={createRemoteDeck({ id: "second", studyFilter: { selectedTags: ["tag2"], tagAndFilter: false } })}
      />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
  });
});

describe("CARD-FILTER-01 CARD-FILTER-05 browsing drafts", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    writeControls.uid = "user-id";
    writeControls.calls = [];
    writeControls.write = undefined;
  });

  it("keeps browsing saves across page changes without leaking them into study filters", async () => {
    // Given: Prepare `write`, `deck` and any shared test state below.
    const write = Promise.withResolvers<void>();
    writeControls.write = () => write.promise;
    const deck = createRemoteDeck({
      id: "browse-pending",
      studyFilter: { selectedTags: ["tag2"], tagAndFilter: true },
    });
    const { unmount: unmountList } = render(<DeckFilterHarness deck={deck} scope="card" />);
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    unmountList();
    const { unmount: unmountStudy } = render(<DeckFilterHarness deck={deck} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    // When: Exercise `unmountStudy` with the prepared inputs.
    unmountStudy();
    render(<DeckFilterHarness deck={deck} scope="card" />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "tag1" }));
    await actAsync(async () => write.resolve());
    // Then: Verify the expected result in the assertions below.
    await waitFor(() =>
      expect(writeControls.calls.at(-1)?.[1]).toEqual({
        id: deck.id,
        cardFilter: { selectedTags: ["tag2"], tagAndFilter: false },
      })
    );
  });

  it("follows saved browsing changes and clearing without copying study conditions", () => {
    // Given: Prepare `deck` and any shared test state below.
    const deck = createRemoteDeck({ id: "browse-live", studyFilter: { selectedTags: ["tag2"], tagAndFilter: true } });
    // When: Exercise `render` with the prepared inputs.
    const view = render(<DeckFilterHarness deck={deck} scope="card" />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("radio", { name: "Any" })).toBeChecked();
    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <DeckFilterHarness deck={{ ...deck, cardFilter: { selectedTags: ["tag1"], tagAndFilter: true } }} scope="card" />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <DeckFilterHarness deck={{ ...deck, cardFilter: { selectedTags: [], tagAndFilter: false } }} scope="card" />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Any" })).toBeChecked();
  });
});
