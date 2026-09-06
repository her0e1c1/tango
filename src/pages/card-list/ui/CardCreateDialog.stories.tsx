import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY } from "@/entities/deck";
import type { CardFormFields } from "@/features/card-form";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardCreateDialog } from "./CardCreateDialog";

interface CardCreateDialogStoryProps {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const CardCreateDialogStory = ({ isSaving, onCancel, onSubmit }: CardCreateDialogStoryProps) => {
  const form = useForm<CardFormFields>({ defaultValues: { frontText: "", backText: "", tags: [] } });

  useEffect(() => {
    if (isSaving) void form.handleSubmit(() => new Promise(() => undefined))();
  }, [form, isSaving]);

  return (
    <CardCreateDialog
      categories={CATEGORY}
      deckName="Spanish vocabulary"
      form={form}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
};

const meta = {
  title: "Pages/Card List/CardCreateDialog",
  component: CardCreateDialogStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { isSaving: false, onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof CardCreateDialogStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = { args: { isSaving: true } };
export const Interaction: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Hello");
    await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Back text" }), "Hola");
    await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
