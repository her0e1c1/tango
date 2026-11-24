import { flushSync } from "react-dom";
import { useCardTagForm } from "@/test/useCardTagForm";
import { BackText } from "@/entities/card";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { fn } from "storybook/test";

import { CATEGORY } from "@/entities/deck";
import { useCardPreviewContent, type CardFormFields } from "@/features/card-form";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardCreator } from "./CardCreator";

interface CardCreatorStoryProps {
  initialValues?: CardFormFields;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: CardFormFields) => Promise<void>;
}

const CardCreatorStory = ({ initialValues, isSaving, onCancel, onSubmit }: CardCreatorStoryProps) => {
  const form = useForm<CardFormFields>({ defaultValues: initialValues ?? { frontText: "", backText: "", tags: [] } });

  const preview = useCardPreviewContent(form.control, "raw", false);

  return (
    <CardCreator
      {...useCardTagForm(form)}
      availableTags={CATEGORY}
      preview={<BackText {...preview} />}
      deckName="Spanish vocabulary"
      form={form}
      pending={isSaving}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
};

const meta = {
  title: "Pages/Card Create/CardCreator",
  component: CardCreatorStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { isSaving: false, onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof CardCreatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = { args: { isSaving: true } };
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };

const longValues: CardFormFields = {
  frontText: "A long question with detailed context. ".repeat(20),
  backText: "An answer explaining the reasoning in detail. ".repeat(30),
  tags: ["Long tag describing the subject", "Vocabulary", "Review"],
};

export const Tablet: Story = {
  args: {
    initialValues: longValues,
  },
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
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: {
    initialValues: longValues,
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Desktop,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkSaving: Story = {
  args: {
    initialValues: longValues,
    isSaving: true,
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
