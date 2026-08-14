/**
 * @file Defines Storybook examples for Remote Read Boundary.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to read states.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { RemoteReadBoundary as Template } from "./RemoteReadBoundary";

const meta = {
  title: "Shared/Feedback/RemoteReadBoundary",
  component: Template,
  tags: ["autodocs"],
  args: { status: "loading", hasData: false, children: "Deck content" },
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
