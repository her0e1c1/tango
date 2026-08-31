import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { RouteFeedback } from "./RouteFeedback";

const meta = {
  title: "Shared/Feedback/RouteFeedback",
  component: RouteFeedback,
  tags: ["autodocs"],
  args: { title: "Starting Tango…", tone: "loading" },
} satisfies Meta<typeof RouteFeedback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const ErrorState: Story = {
  args: {
    title: "Unable to start Tango",
    description: "Authentication could not be initialized.",
    tone: "error",
    primaryAction: {
      label: "Reload",
      onClick: fn(),
    },
  },
};

export const RetryPending: Story = {
  args: {
    title: "Unable to verify the study card",
    description: "The card might still be available.",
    tone: "error",
    primaryAction: {
      label: "Retry",
      onClick: fn(),
      disabled: true,
      loading: true,
    },
    secondaryAction: {
      label: "Exit",
      onClick: fn(),
    },
  },
};

export const NotFound: Story = {
  args: {
    title: "Page not found",
    tone: "not-found",
    primaryAction: {
      label: "Go home",
      onClick: fn(),
    },
    secondaryAction: {
      label: "Go back",
      onClick: fn(),
    },
  },
};

export const Dark: Story = {
  args: { title: "Starting Tango…", tone: "loading" },
  globals: { theme: "dark" },
};
