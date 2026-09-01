import type { Card, CardId } from "@/entities/card";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards, useCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { createLocalCard, createLocalDeck } from "@/test/factories";

import { useCardForm } from "../model/useCardForm";
import { CardEditor } from "./CardEditor";

const writeControls = vi.hoisted(() => ({
  beforeWrite: undefined as (() => Promise<void>) | undefined,
  nextError: undefined as unknown,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    editCard: async (...args: Parameters<typeof actual.editCard>) => {
      if (writeControls.nextError !== undefined) {
        const error = writeControls.nextError;
        writeControls.nextError = undefined;
        throw error;
      }
      await writeControls.beforeWrite?.();
      return actual.editCard(...args);
    },
  };
});
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  CATEGORY: ["language", "math"],
}));

const AvailableCardEditorHarness = (props: { card: Card; onCancel: () => void; onSaved: () => void }) => {
  const editor = useCardForm({ card: props.card, onSaved: props.onSaved });
  return (
    <CardEditor
      cardInfo={editor.cardInfo}
      categories={editor.categories}
      form={editor.form}
      isSaving={editor.isSaving}
      onCancel={props.onCancel}
      onSubmit={editor.onSubmit}
    />
  );
};

const StoredCardEditorHarness = (props: { cardId: CardId; onCancel: () => void; onSaved: () => void }) => {
  const card = useCard(props.cardId);
  return card === undefined ? null : (
    <AvailableCardEditorHarness card={card} onCancel={props.onCancel} onSaved={props.onSaved} />
  );
};

describe("CARD-03 CARD-09 CARD-12 CardEditor", () => {
  const deckId = "card-edit-deck";
  const cardId = "card-id";
  const renderForm = (onSaved = vi.fn(), onCancel = vi.fn()) =>
    render(
      <>
        <StoredCardEditorHarness cardId={cardId} onCancel={onCancel} onSaved={onSaved} />
        <ToastViewport />
      </>
    );

  beforeEach(async () => {
    dismissToast();
    writeControls.beforeWrite = undefined;
    writeControls.nextError = undefined;
    await createDeck("", createLocalDeck({ id: deckId }));
    await mutateCards("", [
      {
        kind: "create",
        card: createLocalCard({
          id: cardId,
          deckId,
          frontText: "Front text",
          backText: "Back text",
          tags: ["language"],
        }),
      },
    ]);
  });

  it("restores successfully saved form values from the Card Entity", async () => {
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    const backText = screen.getByRole("textbox", { name: "Back text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Updated front");
    await userEvent.clear(backText);
    await userEvent.type(backText, "Updated back");
    await userEvent.click(screen.getByRole("checkbox", { name: "math" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    view.unmount();
    renderForm();

    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
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
    expect(screen.getByRole("textbox", { name: "Front text" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
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
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    view.unmount();
    finishSave();

    await waitFor(() => expect(onSaved).not.toHaveBeenCalled());
  });

  it("keeps the draft and saves it after an explicit retry", async () => {
    writeControls.nextError = new Error("write failed");
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(frontText).toHaveValue("Retry front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Retry front");
  });

  it("keeps the opening snapshot when the Card Entity refreshes", async () => {
    renderForm();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Unsaved front");

    await mutateCards("", [
      {
        kind: "edit",
        card: { id: cardId, frontText: "Subscription front", backText: "Subscription back" },
      },
    ]);

    expect(frontText).toHaveValue("Unsaved front");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    const view = renderForm();
    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Back text" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByText("Back text is required.")).toBeVisible();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front text");
  });
});
