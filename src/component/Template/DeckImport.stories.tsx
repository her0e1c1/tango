import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DeckImport as Template } from "./";

const meta = {
  title: "Template/DeckImport",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {},
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
