import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import type { Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import type { CardFormValues } from "../model/useCardForm";
import { CardForm } from "./CardForm";

interface CardFormStoryProps {
  card: Card;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
}

const CardFormStory = ({ card, isSaving, validationError, onCancel }: CardFormStoryProps) => {
  const form = useForm<CardFormValues>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("frontText", { message: "Front text is required." });
      form.setError("backText", { message: "Back text is required." });
    }
    if (isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving, validationError]);

  return (
    <CardForm
      cardInfo={{
        id: card.id,
        uniqueKey: card.uniqueKey,
        ...(card.createdAt ? { createdAt: card.createdAt } : {}),
        ...(card.lastSeenAt != null ? { lastSeenAt: card.lastSeenAt } : {}),
      }}
      categories={CATEGORY}
      form={form}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Pages/Card Form/CardForm",
  component: CardFormStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { card: fixture.card.default, isSaving: false, validationError: false, onCancel: fn() },
} satisfies Meta<typeof CardFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ValidationError: Story = { args: { validationError: true } };
export const Saving: Story = { args: { isSaving: true } };
export const LongContent: Story = { args: { card: longCard } };
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const frontText = canvas.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Updated prompt");
    await expect(frontText).toHaveValue("Updated prompt");

    const firstTag = canvas.getByRole("checkbox", { name: "raw" });
    await expect(firstTag).not.toBeChecked();
    await userEvent.click(firstTag);
    await expect(firstTag).toBeChecked();
  },
};
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };
