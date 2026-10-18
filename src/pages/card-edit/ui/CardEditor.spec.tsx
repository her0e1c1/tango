import "@/test/mockFirestorePersistence";
import { useCardTagForm } from "@/test/useCardTagForm";
import { BackText } from "@/entities/card";
import type { Card, CardId } from "@/entities/card";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard, editCard, useCard } from "@/entities/card";
import { CATEGORY, createDeck } from "@/entities/deck";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { createLocalCard, createLocalDeck } from "@/test/factories";

import { useCardEditFormState } from "../model/useCardEditFormState";
import { submit } from "../model/actions/submit";
import { useCardPreviewContent } from "@/features/card-form";
import { CardEditor } from "./CardEditor";

const writeControls = vi.hoisted(() => ({
  beforeWrite: undefined as (() => Promise<void>) | undefined,
  nextError: undefined as unknown,
}));

vi.mock("@/entities/auth", () => ({
  getAuthUid: () => "user-id",
}));
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
  const { form } = useCardEditFormState(props.card);
  const preview = useCardPreviewContent(form.control, "raw", false);
  return (
    <CardEditor
      {...useCardTagForm(form)}
      cardInfo={{
        id: props.card.id,
        uniqueKey: props.card.uniqueKey,
        ...(props.card.createdAt ? { createdAt: props.card.createdAt } : {}),
      }}
      availableTags={CATEGORY}
      preview={<BackText {...preview} />}
      form={form}
      onCancel={props.onCancel}
      onSubmit={(event) => {
        void form.handleSubmit(async (values) => {
          if (await submit({ cardId: props.card.id, values })) props.onSaved();
        })(event);
      }}
    />
  );
};

const StoredCardEditorHarness = (props: { cardId: CardId; onCancel: () => void; onSaved: () => void }) => {
  const card = useCard(props.cardId);
  return card === undefined ? null : (
    <AvailableCardEditorHarness card={card} onCancel={props.onCancel} onSaved={props.onSaved} />
  );
};

describe("CARD-MANAGEMENT-01 CARD-MANAGEMENT-04 CARD-VIEW-05 CARD-MANAGEMENT-10 CARD-MANAGEMENT-19 CARD-MANAGEMENT-21 CardEditor", () => {
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
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    writeControls.beforeWrite = undefined;
    writeControls.nextError = undefined;
    await createDeck("user-id", createLocalDeck({ id: deckId }));
    await createCard(
      "user-id",
      createLocalCard({
        id: cardId,
        deckId,
        frontText: "Front text",
        backText: "Back text",
        tags: ["language"],
      })
    );
  });

  it("restores successfully saved form values from the Card Entity", async () => {
    // Given: Prepare `onSaved`, `view`, `frontText` and any shared test state below.
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Updated front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    const backText = screen.getByRole("textbox", { name: "Back text" });
    await userEvent.clear(backText);
    await userEvent.type(backText, "Updated back");
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "math" }));
    await userEvent.click(screen.getByRole("button", { name: "Close tag editor" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
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
    expect(screen.getByRole("textbox", { name: "Front text" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    // When: Exercise `finishSave` with the prepared inputs.
    finishSave();
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  });

  it("keeps the draft and saves it after an explicit retry", async () => {
    // Given: Prepare `onSaved`, `view`, `frontText` and any shared test state below.
    writeControls.nextError = new Error("write failed");
    const onSaved = vi.fn();
    const view = renderForm(onSaved);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(frontText).toHaveValue("Retry front");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Retry front");
  });

  it("keeps the opening snapshot when the Card Entity refreshes", async () => {
    // Given: Prepare `frontText` and any shared test state below.
    renderForm();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Unsaved front");

    await editCard("user-id", { id: cardId, frontText: "Subscription front", backText: "Subscription back" });

    // Then: Verify the expected result in the assertions below.
    expect(frontText).toHaveValue("Unsaved front");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
  });

  it("keeps stored values unchanged when validation rejects the form", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderForm();
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Back text" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveFocus();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back text is required.")).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderForm();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front text");
  });
});
