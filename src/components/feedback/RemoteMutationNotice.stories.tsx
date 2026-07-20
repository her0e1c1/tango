/**
 * @file Defines Storybook examples for Remote Mutation Notice.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { RemoteMutationNotice as Template } from "@/components/feedback/RemoteMutationNotice";

const meta = {
  title: "Shared/Feedback/RemoteMutationNotice",
  component: Template,
  tags: ["autodocs"],
  args: { pending: true, error: null, onRetry: () => {} },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Deleting: Story = {
  args: { pendingLabel: "Deleting deck…" },
};

export const DefaultError: Story = {
  args: { pending: false, error: new Error("save failed") },
};

export const AccountError: Story = {
  args: {
    pending: false,
    error: new Error("account deletion failed"),
    errorLabel: "Unable to delete account.",
  },
};
