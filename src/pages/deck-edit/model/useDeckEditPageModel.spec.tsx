import "@/test/mockFirestorePersistence";
import type { Deck, DeckId } from "@/entities/deck";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CATEGORY, useDeck } from "@/entities/deck";
import { DeckForm } from "@/features/deck-form";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { createLocalDeck } from "@/test/factories";

import { useDeckEditPageModel } from "./useDeckEditPageModel";

const authControls = vi.hoisted(() => ({ uid: "user-id" }));
const writeControls = vi.hoisted(() => ({
  beforeWrite: undefined as (() => Promise<void>) | undefined,
  nextError: undefined as unknown,
  writes: [] as { uid: string; deck: Record<string, unknown> }[],
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/auth", () => ({
  getAuthUid: () => authControls.uid,
  useAuth: () => ({ isAnonymous: authControls.uid === "" }),
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    CATEGORY: ["language", "science"],
    editDeck: async (...args: Parameters<typeof actual.editDeck>) => {
      writeControls.writes.push({ uid: args[0], deck: args[1] });
      if (writeControls.nextError !== undefined) {
        const error = writeControls.nextError;
        writeControls.nextError = undefined;
        throw error;
      }
      await writeControls.beforeWrite?.();
      return actual.editDeck(...args);
    },
  };
});

const AvailableDeckFormHarness = (props: { deck: Deck }) => {
  const { form, onCancel, onSubmit } = useDeckEditPageModel(props.deck);
  return (
    <DeckForm
      mode="edit"
      categories={CATEGORY}
      deckInfo={{ id: props.deck.id, createdAt: props.deck.createdAt, updatedAt: props.deck.updatedAt }}
      deckName={props.deck.name}
      form={form}
      onCancel={onCancel}
      onSubmit={(event) => void onSubmit(event)}
    />
  );
};

const StoredDeckFormHarness = (props: { deckId: DeckId }) => {
  const deck = useDeck(props.deckId);
  return deck === undefined ? null : <AvailableDeckFormHarness deck={deck} />;
};

describe("DECK-MANAGEMENT-01 DECK-MANAGEMENT-08 PERSISTENCE-04 useDeckEditPageModel", () => {
  const deckId = "deck-id";
  const renderForm = () => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/edit", element: <StoredDeckFormHarness deckId={deckId} /> },
      ],
      { initialEntries: ["/edit"] }
    );
    return render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
  };

  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    authControls.uid = "user-id";
    writeControls.beforeWrite = undefined;
    writeControls.nextError = undefined;
    writeControls.writes = [];
    replaceRemoteDecks([createLocalDeck({ id: deckId, name: "Deck name", category: "language", convertToBr: false })]);
  });

  it("restores successfully saved form values from the Deck Entity", async () => {
    // Given: Prepare `view`, `name` and any shared test state below.
    const view = renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, " Updated deck ");
    await userEvent.selectOptions(screen.getByRole("combobox"), "science");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Updated deck");
    expect(screen.getByRole("combobox")).toHaveValue("science");
  });

  it("reads the current authenticated user when submission starts", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderForm();
    authControls.uid = "latest-user";

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(writeControls.writes).toEqual([]);
  });

  it("disables every edit and exit control while saving", async () => {
    // Given: Prepare `finishSave` and any shared test state below.
    let finishSave: () => void = () => undefined;
    writeControls.beforeWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    renderForm();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to decks" })).toBeDisabled();
    // When: Exercise `finishSave` with the prepared inputs.
    finishSave();
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
  });

  it("keeps the draft and saves it after an explicit retry", async () => {
    // Given: Prepare `view`, `name` and any shared test state below.
    writeControls.nextError = new Error("write failed");
    const view = renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(name).toHaveValue("Retry deck");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Retry deck");
  });

  it("keeps the opening form values when the Deck Entity refreshes", async () => {
    // Given: Prepare `name` and any shared test state below.
    renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");

    replaceRemoteDecks([createLocalDeck({ id: deckId, name: "Subscription name", category: "science" })]);

    // Then: Verify the expected result in the assertions below.
    expect(name).toHaveValue("Unsaved deck");
    expect(screen.getByRole("combobox")).toHaveValue("language");
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderForm();
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(name, "Corrected name");
    // Then: Verify the expected result in the assertions below.
    expect(name).toHaveValue("Corrected name");
    expect(name).toHaveFocus();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
  });
});
