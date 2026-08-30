import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { fn } from "storybook/test";

import type { Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import type { CardFormValues } from "../model/useCardForm";
import { CardEditor } from "./CardEditor";

interface CardEditorStoryProps {
  card: Card;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
}

const CardEditorStory = ({ card, isSaving, validationError, onCancel }: CardEditorStoryProps) => {
  const form = useForm<CardFormValues>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
  });

  useEffect(() => {
    if (validationError) {
      form.setError("frontText", { message: "Front text is required." });
      form.setError("backText", { message: "Back text is required." });
    }
  }, [form, validationError]);

  return (
    <CardEditor
      cardInfo={{
        id: card.id,
        uniqueKey: card.uniqueKey,
        ...(card.createdAt ? { createdAt: card.createdAt } : {}),
        ...(card.lastSeenAt != null ? { lastSeenAt: card.lastSeenAt } : {}),
      }}
      categories={CATEGORY}
      form={form}
      isSaving={isSaving}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Pages/Card Form/CardEditor",
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
