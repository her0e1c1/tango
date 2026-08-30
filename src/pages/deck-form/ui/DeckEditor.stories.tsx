import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY, type Deck } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import type { DeckFormValues } from "../model/useDeckForm";
import { DeckEditor } from "./DeckEditor";

interface DeckEditorStoryProps {
  deck: Deck;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const DeckEditorStory = ({ deck, isSaving, validationError, onCancel, onDelete }: DeckEditorStoryProps) => {
  const form = useForm<DeckFormValues>({
    defaultValues: {
      name: deck.name,
      category: deck.category,
      url: deck.url ?? undefined,
      convertToBr: deck.convertToBr,
      localMode: deck.localMode,
    },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("name", { message: "Deck name is required." });
      form.setError("url", { message: "Enter a valid URL." });
    }
  }, [form, validationError]);

  return (
    <DeckEditor
      categories={CATEGORY}
      deckInfo={{ id: deck.id, createdAt: deck.createdAt, updatedAt: deck.updatedAt }}
      deckName={deck.name}
      form={form}
      isLocalOnly={deck.localMode}
      isSaving={isSaving}
      onCancel={onCancel}
      onDelete={onDelete}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const longDeck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
};

const meta = {
  title: "Pages/Deck Form/DeckEditor",
  component: DeckEditorStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deck: fixture.deck.default,
    isSaving: false,
    validationError: false,
    onCancel: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DeckEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Convert line breaks" });
    const initialValue = checkbox.checked;
    await userEvent.click(checkbox);
    await expect(checkbox.checked).toBe(!initialValue);
  },
};
export const Saving: Story = { args: { isSaving: true } };
export const ValidationError: Story = { args: { validationError: true } };
export const LongValues: Story = { args: { deck: longDeck } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = { ...LongValues, globals: { viewport: { value: "iphonex", isRotated: false } } };
