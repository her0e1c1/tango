import "@/test/mockFirestorePersistence";
import type { Deck, DeckId } from "@/entities/deck";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CATEGORY, useDeck } from "@/entities/deck";
import { DeckForm } from "@/features/deck-form";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { replaceRemoteDecks } from "@/test/entityFixtures";
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
    dismissToast();
    authControls.uid = "user-id";
    writeControls.beforeWrite = undefined;
    writeControls.nextError = undefined;
    writeControls.writes = [];
    replaceRemoteDecks([createLocalDeck({ id: deckId, name: "Deck name", category: "language", convertToBr: false })]);
  });

  it("restores successfully saved form values from the Deck Entity", async () => {
    const view = renderForm();
    await userEvent.click(screen.getByText("More settings"));
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, " Updated deck ");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "science");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
    view.unmount();
    renderForm();
    await userEvent.click(screen.getByText("More settings"));

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Updated deck");
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveValue("https://example.com/deck.csv");
    expect(screen.getByRole("checkbox", { name: "Convert line breaks" })).toBeChecked();
    expect(screen.getByRole("combobox")).toHaveValue("science");
  });

  it("reads the current authenticated user when submission starts", async () => {
    renderForm();
    authControls.uid = "latest-user";

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(writeControls.writes.at(-1)?.uid).toBe("latest-user");
  });

  it("disables every edit and exit control while saving", async () => {
    let finishSave: () => void = () => undefined;
    writeControls.beforeWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to decks" })).toBeDisabled();
    finishSave();
    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
  });

  it("removes a cleared optional URL from the stored Deck", async () => {
    replaceRemoteDecks([createLocalDeck({ id: deckId, name: "Deck name", url: "https://example.com/deck.csv" })]);
    const view = renderForm();
    await userEvent.click(screen.getByText("More settings"));
    await userEvent.clear(screen.getByRole("textbox", { name: "Source URL" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
    view.unmount();
    renderForm();
    await userEvent.click(screen.getByText("More settings"));
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveValue("");
  });

  it("keeps the draft and saves it after an explicit retry", async () => {
    writeControls.nextError = new Error("write failed");
    const view = renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(name).toHaveValue("Retry deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { name: "Deck list" })).toBeVisible();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Retry deck");
  });

  it("keeps the opening form values when the Deck Entity refreshes", async () => {
    renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");

    replaceRemoteDecks([createLocalDeck({ id: deckId, name: "Subscription name", category: "science" })]);

    expect(name).toHaveValue("Unsaved deck");
    expect(screen.getByRole("combobox")).toHaveValue("language");
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    const view = renderForm();
    await userEvent.click(screen.getByText("More settings"));
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "not-a-url");
    await userEvent.click(screen.getByText("More settings"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(name, "Corrected name");
    expect(name).toHaveValue("Corrected name");
    expect(name).toHaveFocus();
    await userEvent.click(screen.getByText("More settings"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("textbox", { name: "Source URL" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveFocus();
    view.unmount();
    renderForm();
    await userEvent.click(screen.getByText("More settings"));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
  });
});
