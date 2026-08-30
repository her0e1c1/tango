import type { DeckId } from "@/entities/deck";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck, useDeck } from "@/entities/deck";
import { createLocalDeck } from "@/test/factories";

import { useDeckForm } from "../model/useDeckForm";

const writeControls = vi.hoisted(() => ({
  beforeWrite: undefined as (() => Promise<void>) | undefined,
  nextError: undefined as unknown,
  writes: [] as { uid: string; deck: Record<string, unknown> }[],
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    CATEGORY: ["language", "science"],
    // Keep successful writes on the real local Entity path while controlling only failure and timing.
    editDeck: async (...args: Parameters<typeof actual.editDeck>) => {
      writeControls.writes.push({ uid: args[0], deck: args[1] });
      if (writeControls.nextError !== undefined) {
        const error = writeControls.nextError;
        writeControls.nextError = undefined;
        throw error;
      }
      await writeControls.beforeWrite?.();
      if (args[1].localMode === false) return;
      return actual.editDeck(...args);
    },
  };
});

import { DeckEditor } from "./DeckEditor";

const DeckEditorHarness = (props: { deckId: string; onCancel: () => void; onSaved: () => void }) => {
  const editor = useDeckForm({ deckId: props.deckId, onSaved: props.onSaved });

  if (editor == null) return null;
  return (
    <DeckEditor
      categories={editor.categories}
      deckInfo={editor.deckInfo}
      deckName={editor.deckName}
      form={editor.form}
      isLocalOnly={editor.isLocalOnly}
      onCancel={props.onCancel}
      onDelete={() => undefined}
      onSubmit={editor.onSubmit}
      saveError={editor.saveError}
    />
  );
};

// A fresh Entity read after remount proves that the form displays the last successful edit.
const StoredDeckEditorHarness = (props: { deckId: DeckId; onCancel: () => void; onSaved: () => void }) => {
  const deck = useDeck(props.deckId);
  return deck === undefined ? null : (
    <DeckEditorHarness deckId={deck.id} onCancel={props.onCancel} onSaved={props.onSaved} />
  );
};

describe("DeckEditor", () => {
  const deckId = "deck-id";
  const renderForm = (onSaved = vi.fn(), onCancel = vi.fn()) =>
    render(<StoredDeckEditorHarness deckId={deckId} onCancel={onCancel} onSaved={onSaved} />);

  beforeEach(async () => {
    writeControls.beforeWrite = undefined;
    writeControls.nextError = undefined;
    writeControls.writes = [];
    await createDeck(
      "",
      createLocalDeck({
        id: deckId,
        name: "Deck name",
        category: "language",
        convertToBr: false,
      })
    );
  });

  it("restores successfully saved form values from the Deck Entity", async () => {
    const onSaved = vi.fn();
    const view = renderForm(onSaved);

    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, " Updated deck ");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "science");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    view.unmount();
    renderForm();

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Updated deck");
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveValue("https://example.com/deck.csv");
    expect(screen.getByRole("checkbox", { name: "Convert line breaks" })).toBeChecked();
    expect(screen.getByRole("combobox")).toHaveValue("science");
  });

  it("requests Firestore persistence when local-only storage is turned off", async () => {
    const onSaved = vi.fn();
    renderForm(onSaved);
    const localOnly = screen.getByRole("checkbox", { name: "Local only" });

    expect(localOnly).toBeChecked();
    expect(screen.getByText(/save this deck and its cards to Firestore/)).toBeVisible();
    await userEvent.click(localOnly);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(writeControls.writes.at(-1)).toEqual({
      uid: "user-id",
      deck: expect.objectContaining({ id: deckId, localMode: false }),
    });
  });

  it("uses the form submit state while saving", async () => {
    let finishSave: () => void = () => undefined;
    writeControls.beforeWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    finishSave();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  });

  it("does not navigate when saving finishes after leaving the editor", async () => {
    let finishSave: () => void = () => undefined;
    writeControls.beforeWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Saved after leaving");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    view.unmount();
    finishSave();
    renderForm();

    await waitFor(() => expect(screen.getByRole("heading", { name: "Saved after leaving" })).toBeVisible());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("removes a cleared optional URL from the stored Deck", async () => {
    await createDeck("", createLocalDeck({ id: deckId, name: "Deck name", url: "https://example.com/deck.csv" }));
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    await userEvent.clear(screen.getByRole("textbox", { name: "Source URL" }));

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveValue("");
  });

  it("keeps edited values and saves them after retrying a failure", async () => {
    writeControls.nextError = new Error("write failed");
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(name).toHaveValue("Retry deck");
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument());
    expect(onSaved).toHaveBeenCalledOnce();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Retry deck");
  });

  it("keeps dirty fields when the Deck Entity refreshes", async () => {
    renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");

    await createDeck(
      "",
      createLocalDeck({
        id: deckId,
        name: "Subscription name",
        category: "science",
        convertToBr: false,
      })
    );

    expect(name).toHaveValue("Unsaved deck");
    expect(screen.getByRole("combobox")).toHaveValue("science");
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    const view = renderForm();
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "not-a-url");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveValue("");
  });
});
