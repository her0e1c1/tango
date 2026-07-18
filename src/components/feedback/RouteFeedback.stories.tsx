import type { Meta, StoryObj } from "@storybook/react";

import { RouteFeedback as Template } from "@/components/feedback/RouteFeedback";

const meta = {
  title: "Shared/Feedback/RouteFeedback",
  component: Template,
  tags: ["autodocs"],
  args: { title: "Starting Tango…", tone: "loading" },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const ErrorState: Story = {
  args: {
    title: "Unable to start Tango",
    description: "Authentication could not be initialized.",
    tone: "error",
    primaryAction: { label: "Reload", onClick: () => {} },
  },
};

export const NotFound: Story = {
  args: {
    title: "Page not found",
    tone: "not-found",
    primaryAction: { label: "Go home", onClick: () => {} },
    secondaryAction: { label: "Go back", onClick: () => {} },
  },
};

export const Dark: Story = {
  args: { title: "Starting Tango…", tone: "loading" },
  globals: { theme: "dark" },
};
