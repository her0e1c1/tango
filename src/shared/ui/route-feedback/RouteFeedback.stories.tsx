import type { Meta, StoryObj } from "@storybook/react-vite";
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

export const CustomLayout: Story = {
  ...NotFound,
  args: {
    ...NotFound.args,
    layout: ({ children }) => (
      <div className="flex min-h-dvh flex-col gap-4 bg-surface p-4">
        <p role="status">Some saved data could not be loaded. Its saved data is unchanged.</p>
        {children}
      </div>
    ),
  },
};

export const Dark: Story = {
  args: { title: "Starting Tango…", tone: "loading" },
  globals: { theme: "dark" },
};

export const Mobile: Story = {
  ...ErrorState,
  args: {
    ...ErrorState.args,
    description:
      "Authentication could not be initialized. Please check your connection and try loading this page again. ".repeat(
        4
      ),
  },
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...NotFound,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Mobile,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-2xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  argTypes: { tone: { control: "radio", options: ["loading", "error", "not-found"] } },
  render: (args) => (
    <RouteFeedback
      {...meta.args}
      {...(args.tone === "error" ? Mobile.args : args.tone === "not-found" ? NotFound.args : {})}
    />
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
