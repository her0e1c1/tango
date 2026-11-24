import { flushSync } from "react-dom";
import { useCardTagForm } from "@/test/useCardTagForm";
import { BackText } from "@/entities/card";
import { useCardPreviewContent } from "@/features/card-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm, type FieldErrors } from "react-hook-form";
import { fn } from "storybook/test";

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

const noErrors: FieldErrors<CardContentInput> = {};
const invalidContent: FieldErrors<CardContentInput> = {
  frontText: { type: "required", message: "Front text is required." },
  backText: { type: "required", message: "Back text is required." },
};

const CardEditorStory = ({ card, isSaving, validationError, onCancel }: CardEditorStoryProps) => {
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
    errors: validationError ? invalidContent : noErrors,
  });

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
      pending={isSaving}
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

export const Tablet: Story = {
  ...LongValues,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...LongValues,
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: { card: longCard, validationError: true },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkSaving: Story = {
  args: { card: longCard, isSaving: true },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
