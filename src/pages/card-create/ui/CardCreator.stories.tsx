import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";

import { CATEGORY } from "@/entities/deck";
import type { CardFormFields } from "@/features/card-form";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardCreator } from "./CardCreator";

interface CardCreatorStoryProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const CardCreatorStory = ({ isSubmitting, onCancel, onSubmit }: CardCreatorStoryProps) => {
  const form = useForm<CardFormFields>({ defaultValues: { frontText: "", backText: "", tags: [] } });

  return (
    <CardCreator
      categories={CATEGORY}
      deckName="Spanish vocabulary"
      form={form}
      isSubmitting={isSubmitting}
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
  args: { isSubmitting: false, onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof CardCreatorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = {
  args: { isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Creating…" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Cancel" })).toBeEnabled();
  },
};
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
