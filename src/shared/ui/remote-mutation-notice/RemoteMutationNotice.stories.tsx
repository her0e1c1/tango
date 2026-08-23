import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { RemoteMutationNotice } from "./RemoteMutationNotice";

const meta = {
  title: "Shared/Feedback/RemoteMutationNotice",
  component: RemoteMutationNotice,
  tags: ["autodocs"],
  args: {
    pending: true,
    error: null,
    onRetry: fn(),
  },
} satisfies Meta<typeof RemoteMutationNotice>;

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
