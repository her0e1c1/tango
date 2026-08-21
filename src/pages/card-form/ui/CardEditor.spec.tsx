import type { CardId } from "@/entities/card";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards, useCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { createLocalCard, createLocalDeck } from "@/test/factories";

import { useCardFormState } from "../model/useCardFormState";

const writeControls = vi.hoisted(() => ({
  beforeWrite: undefined as (() => Promise<void>) | undefined,
  nextError: undefined as unknown,
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    // Keep successful writes on the real local Entity path while controlling only failure and timing.
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

import { CardEditor } from "./CardEditor";

const CardEditorHarness = (props: { cardId: string; onCancel: () => void; onSaved: () => void }) => {
  const editor = useCardFormState({ cardId: props.cardId, onCancel: props.onCancel, onSaved: props.onSaved });

  if (editor == null) return null;
  return <CardEditor form={editor.form} saveError={editor.saveError} />;
};

// A fresh Entity read after remount proves that the form displays the last successful edit.
const StoredCardEditorHarness = (props: { cardId: CardId; onCancel: () => void; onSaved: () => void }) => {
  const card = useCard(props.cardId);
  return card === undefined ? null : (
    <CardEditorHarness cardId={card.id} onCancel={props.onCancel} onSaved={props.onSaved} />
  );
};

describe("CardEditor", () => {
  const deckId = "card-edit-deck";
  const cardId = "card-id";
  const renderForm = (onSaved = vi.fn(), onCancel = vi.fn()) =>
    render(<StoredCardEditorHarness cardId={cardId} onCancel={onCancel} onSaved={onSaved} />);

  beforeEach(async () => {
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
    expect(screen.getByRole("checkbox", { name: "language" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
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

  it("keeps edited values and saves them after retrying a failure", async () => {
    writeControls.nextError = new Error("write failed");
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(frontText).toHaveValue("Retry front");
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument());
    expect(onSaved).toHaveBeenCalledOnce();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Retry front");
  });

  it("forwards cancellation from both navigation actions", async () => {
    const onCancel = vi.fn();
    renderForm(vi.fn(), onCancel);

    await userEvent.click(screen.getByRole("button", { name: "Back to cards" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    const view = renderForm();
    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "   ");
    await userEvent.clear(screen.getByRole("textbox", { name: "Back text" }));

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByText("Back text is required.")).toBeVisible();
    view.unmount();
    renderForm();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front text");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
  });
});
