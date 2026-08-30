import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect } from "storybook/test";

import type { Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardFields, type CardFormFields } from "./CardFields";

interface CardFieldsStoryProps {
  card: Card;
  validationError: boolean;
}

const CardFieldsStory = ({ card, validationError }: CardFieldsStoryProps) => {
  const form = useForm<CardFormFields>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("frontText", { message: "Front text is required." });
      form.setError("backText", { message: "Back text is required." });
    }
  }, [form, validationError]);

  return <CardFields categories={CATEGORY} form={form} />;
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Features/Card Form/CardFields",
  component: CardFieldsStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { card: fixture.card.default, validationError: false },
} satisfies Meta<typeof CardFieldsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ValidationError: Story = { args: { validationError: true } };
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
