import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { DeckCreateView, type DeckCreateViewProps } from "./DeckCreateView";

const createForm = (remoteStorageAvailable: boolean): DeckCreateViewProps["form"] => ({
  fields: {
    name: { defaultValue: "Japanese vocabulary" },
    category: { options: [{ label: "Language", value: "language" }] },
    localMode: {
      checked: !remoteStorageAvailable,
      disabled: !remoteStorageAvailable,
      onChange: fn(),
    },
  },
  errors: { name: undefined },
  isSubmitting: false,
  remoteStorageAvailable,
  onCancel: fn(),
  onSubmit: fn(),
});

const meta = {
  title: "Pages/Deck Create/DeckCreateView",
  component: DeckCreateView,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: { form: createForm(true) },
} satisfies Meta<typeof DeckCreateView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GoogleAccount: Story = {};

export const AnonymousLocalOnly: Story = {
  args: { form: createForm(false) },
};

export const SaveError: Story = {
  args: { saveError: new Error("Deck write failed") },
};
