import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { NavigationGuardDialog } from "./NavigationGuardDialog";

const meta = {
  title: "Shared/Router/NavigationGuardDialog",
  component: NavigationGuardDialog,
  args: {
    onDiscardChanges: fn(),
    onKeepEditing: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NavigationGuardDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
