import { useCardTagForm } from "@/test/useCardTagForm";
import { editCard as persistCard } from "@/entities/card";
import { APP_STORY_UID, prepareAppStory } from "@/storybook/appStory";
import { createCard, createDeck } from "@/test/factories";
import { ToastViewport } from "@/shared/ui/toast";
import { useCardEditFormState } from "../model/useCardEditFormState";
import { submit } from "../model/actions/submit";
import { BackText } from "@/entities/card";
import { useCardPreviewContent } from "@/features/card-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { expect, fn, mocked, waitFor } from "storybook/test";

import type { Card, CardContentInput } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardEditor } from "./CardEditor";

interface CardEditorStoryProps {
  card: Card;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
}

const CardEditorStory = ({ card, isSaving, validationError, onCancel }: CardEditorStoryProps) => {
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("frontText", { message: "Front text is required." });
      form.setError("backText", { message: "Back text is required." });
    }
  }, [form, validationError]);

  useEffect(() => {
    if (!isSaving) return;
    const pending = Promise.withResolvers<void>();
    // Drive the saving preview through RHF, just as a pending persistence request does.
    void form.handleSubmit(() => pending.promise)();
    return () => pending.resolve();
  }, [form, isSaving]);

  const preview = useCardPreviewContent(form.control, "raw", false);

  return (
    <CardEditor
      {...useCardTagForm(form)}
      cardInfo={{
        id: card.id,
        uniqueKey: card.uniqueKey,
        ...(card.createdAt ? { createdAt: card.createdAt } : {}),
      }}
      availableTags={CATEGORY}
      preview={<BackText {...preview} />}
      form={form}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Pages/Card Edit/CardEditor",
  component: CardEditorStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: { card: fixture.card.default, isSaving: false, validationError: false, onCancel: fn() },
} satisfies Meta<typeof CardEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = { args: { isSaving: true } };
export const ValidationError: Story = { args: { validationError: true } };
export const LongValues: Story = { args: { card: longCard } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = { ...LongValues, globals: { viewport: { value: "iphonex", isRotated: false } } };

const editingDeck = createDeck({ id: "edit-story-deck", uid: APP_STORY_UID });
const editingCard = createCard({
  id: "edit-story-card",
  deckId: editingDeck.id,
  uid: APP_STORY_UID,
  frontText: "Front text",
  backText: "Back text",
});
const onSaved = fn();
function SavingEditorExample() {
  const [card, setCard] = useState(editingCard);
  const { form } = useCardEditFormState(card);
  const preview = useCardPreviewContent(form.control, "raw", false);
  return (
    <>
      <button
        type="button"
        onClick={() => setCard({ ...card, frontText: "External front", backText: "External back" })}
      >
        Receive external update
      </button>
      <CardEditor
        {...useCardTagForm(form)}
        cardInfo={{ id: card.id, uniqueKey: card.uniqueKey }}
        availableTags={CATEGORY}
        preview={<BackText {...preview} />}
        form={form}
        onCancel={() => undefined}
        onSubmit={form.handleSubmit(async (values) => {
          if (await submit({ cardId: card.id, values })) onSaved();
        })}
      />
      <ToastViewport />
    </>
  );
}
const savingParameters = { page: { path: "/", decks: [editingDeck], cards: [editingCard] } };
const prepareEditing: NonNullable<Story["beforeEach"]> = async (context) => {
  const cleanup = await prepareAppStory(context);
  mocked(persistCard).mockResolvedValue(undefined);
  onSaved.mockClear();
  return () => {
    mocked(persistCard).mockReset();
    cleanup?.();
  };
};
export const PendingSave: Story = {
  beforeEach: prepareEditing,
  parameters: savingParameters,
  render: () => <SavingEditorExample />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-20 Disable editing and departure while saving", async () => {
      const pending = Promise.withResolvers<void>();
      mocked(persistCard).mockReturnValue(pending.promise);
      try {
        await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
        for (const name of ["Saving…", "Cancel", "Back to cards"])
          await expect(canvas.getByRole("button", { name })).toBeDisabled();
        await expect(canvas.getByRole("textbox", { name: "Front text" })).toBeDisabled();
        pending.resolve();
        await waitFor(() => expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled());
        await expect(onSaved).toHaveBeenCalledOnce();
      } finally {
        pending.resolve();
      }
    });
  },
};
export const ExternalUpdate: Story = {
  beforeEach: prepareEditing,
  parameters: savingParameters,
  render: () => <SavingEditorExample />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-21 Keep the editing snapshot after external data changes", async () => {
      const front = canvas.getByRole("textbox", { name: "Front text" });
      await userEvent.clear(front);
      await userEvent.type(front, "Unsaved front");
      await userEvent.click(canvas.getByRole("button", { name: "Receive external update" }));
      await expect(front).toHaveValue("Unsaved front");
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
    });
  },
};
export const BothSidesInvalid: Story = {
  beforeEach: prepareEditing,
  parameters: savingParameters,
  render: () => <SavingEditorExample />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-22 Focus the invalid front before the invalid back", async () => {
      await userEvent.clear(canvas.getByRole("textbox", { name: "Front text" }));
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await userEvent.clear(canvas.getByRole("textbox", { name: "Back text" }));
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveFocus());
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
        "Front text is required."
      );
      await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
        "Back text is required."
      );
      await expect(persistCard).not.toHaveBeenCalled();
    });
  },
};
export const RetrySave: Story = {
  beforeEach: prepareEditing,
  parameters: savingParameters,
  render: () => <SavingEditorExample />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-FORM-23 Preserve the failed edit and complete an explicit retry", async () => {
      mocked(persistCard).mockRejectedValueOnce(new Error("rejected"));
      const front = canvas.getByRole("textbox", { name: "Front text" });
      await userEvent.clear(front);
      await userEvent.type(front, "Retry front");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByText("Unable to save changes. Try again.")).toBeVisible();
      await expect(front).toHaveValue("Retry front");
      await expect(onSaved).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
      await expect(persistCard).toHaveBeenLastCalledWith(
        APP_STORY_UID,
        expect.objectContaining({ id: editingCard.id, frontText: "Retry front", backText: "Back text" })
      );
    });
  },
};
