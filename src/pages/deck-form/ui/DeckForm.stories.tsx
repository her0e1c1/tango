import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY, type Deck } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import type { DeckFormValues } from "../model/useDeckForm";
import { DeckForm } from "./DeckForm";

interface DeckFormStoryProps {
  deck: Deck;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
}

const DeckFormStory = ({ deck, isSaving, validationError, onCancel }: DeckFormStoryProps) => {
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
    if (isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving, validationError]);

  return (
    <DeckForm
      categories={CATEGORY}
      deckInfo={{ id: deck.id, createdAt: deck.createdAt, updatedAt: deck.updatedAt }}
      form={form}
      isLocalOnly={deck.localMode}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const longDeck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
};

const meta = {
  title: "Pages/Deck Form/DeckForm",
  component: DeckFormStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { deck: fixture.deck.default, isSaving: false, validationError: false, onCancel: fn() },
} satisfies Meta<typeof DeckFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LocalDeck: Story = { args: { deck: { ...fixture.deck.default, localMode: true } } };
export const ValidationError: Story = { args: { validationError: true } };
export const Saving: Story = { args: { isSaving: true } };
export const LongContent: Story = { args: { deck: longDeck } };
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const convertLineBreaks = canvas.getByRole("checkbox", { name: "Convert line breaks" });
    await userEvent.click(convertLineBreaks);
    await expect(convertLineBreaks).toBeChecked();
  },
};
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };
