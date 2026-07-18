import type { Meta, StoryObj } from "@storybook/react";

import { RemoteReadBoundary as Template } from "@/components/feedback/RemoteReadBoundary";
import { RouteFeedback } from "@/components/feedback/RouteFeedback";

const meta = {
  title: "Shared/Feedback/RemoteReadBoundary",
  component: Template,
  tags: ["autodocs"],
  args: { status: "loading", hasData: false, onRetry: () => {}, children: "Deck content" },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialLoading: Story = {};

export const InitialError: Story = {
  args: { status: "error", hasData: false },
};

export const CachedSyncError: Story = {
  args: { status: "error", hasData: true, children: "Cached deck content" },
};

export const BlockedStorage: Story = {
  args: { status: "blocked", hasData: false },
};

export const EmptyRead: Story = {
  args: {
    status: "ready",
    hasData: false,
    emptyContent: <RouteFeedback title="No decks yet." tone="not-found" />,
  },
};
