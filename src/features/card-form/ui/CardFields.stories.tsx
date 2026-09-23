import { useCardPreviewContent } from "../model/queries/useCardPreviewContent";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { expect, within } from "storybook/test";

import { BackText, type Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardFields, type CardFormFields } from "./CardFields";

interface CardFieldsStoryProps {
  card: Card;
  validationError: boolean;
  dark: boolean;
}

const validationErrors = { frontText: { type: "custom" }, backText: { type: "custom" } };

const CardFieldsStory = ({ card, validationError, dark }: CardFieldsStoryProps) => {
  const form = useForm<CardFormFields>({
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
    ...(validationError ? { errors: validationErrors } : {}),
  });

  const preview = useCardPreviewContent(form.control, "raw", dark);
  return <CardFields categories={CATEGORY} preview={<BackText {...preview} />} form={form} />;
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Features/Card Form/CardFields",
  component: CardFieldsStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { card: fixture.card.default, validationError: false, dark: false },
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

    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
    await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt");
    await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
    const firstTag = canvas.getByRole("checkbox", { name: "raw" });
    await expect(firstTag).not.toBeChecked();
    await userEvent.click(firstTag);
    await expect(firstTag).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Done" }));
  },
};
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };

export const Empty: Story = { args: { card: { ...fixture.card.default, frontText: "", backText: "", tags: [] } } };
export const Back: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
  },
};
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
  },
};
export const ExpandedValidationError: Story = {
  ...Expanded,
  args: { card: { ...fixture.card.default, frontText: "", backText: "" }, validationError: true },
};
export const TagSelection: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
  },
};
export const MobileBack: Story = {
  ...Back,
  ...LongContent,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const JapaneseValidation: Story = {
  args: { validationError: true },
  parameters: { locale: "ja" },
  play: async ({ canvas }) => {
    await canvas.findByText("表面のテキストは必須です。");
    await expect(canvas.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
      "表面のテキストは必須です。"
    );
    await expect(document.documentElement).toHaveAttribute("lang", "ja");
  },
};

export const Preview: Story = {
  args: { card: { ...fixture.card.default, backText: "**Draft answer**\n\n$x^2$", tags: ["math"] } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
    await expect(canvas.getByRole("region", { name: "Answer preview" })).toBeVisible();
  },
};
export const MobilePreview: Story = { ...Preview, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const DarkCodePreview: Story = {
  ...Preview,
  args: { dark: true, card: { ...fixture.card.default, backText: "const answer = 42;", tags: ["typescript"] } },
  globals: { theme: "dark" },
};
export const ExpandedPreview: Story = {
  ...Preview,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand Back" }));
    await userEvent.click(within(canvas.getByRole("dialog")).getByRole("button", { name: "Preview answer" }));
  },
};
