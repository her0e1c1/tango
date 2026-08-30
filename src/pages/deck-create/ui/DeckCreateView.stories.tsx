import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import type { DeckCreateFormValues } from "../model/useDeckCreateForm";
import { DeckCreateView } from "./DeckCreateView";

interface DeckCreateViewStoryProps {
  isLocalModeLocked: boolean;
  isSaving: boolean;
  validationError: boolean;
  onCancel: () => void;
}

const DeckCreateViewStory = ({ isLocalModeLocked, isSaving, validationError, onCancel }: DeckCreateViewStoryProps) => {
  const form = useForm<DeckCreateFormValues>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
  });

  useEffect(() => {
    if (validationError) form.setError("name", { message: "Deck name is required." });
    if (isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving, validationError]);

  return (
    <DeckCreateView
      categories={CATEGORY}
      form={form}
      isLocalModeLocked={isLocalModeLocked}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(() => undefined)}
    />
  );
};

const meta = {
  title: "Pages/Deck Create/DeckCreateView",
  component: DeckCreateViewStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    isLocalModeLocked: false,
    isSaving: false,
    validationError: false,
    onCancel: fn(),
  },
} satisfies Meta<typeof DeckCreateViewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ValidationError: Story = { args: { validationError: true } };
export const Saving: Story = { args: { isSaving: true } };
export const LocalModeLocked: Story = { args: { isLocalModeLocked: true } };
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(name, "New deck");
    await expect(name).toHaveValue("New deck");

    const category = canvas.getByRole("combobox");
    await userEvent.selectOptions(category, "math");
    await expect(category).toHaveValue("math");

    const localOnly = canvas.getByRole("checkbox", { name: "Local only" });
    await userEvent.click(localOnly);
    await expect(localOnly).toBeChecked();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
