import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DeckList as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Template/DeckList",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    decks: fixture.decks.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    decks: [],
  },
};

export const Long: Story = {
  args: {
    decks: fixture.decks.long,
  },
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};

export const IphoneXLong: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
  args: {
    decks: fixture.decks.long,
  },
};
