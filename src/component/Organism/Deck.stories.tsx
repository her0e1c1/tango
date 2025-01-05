import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DeckCard as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/DeckCard",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    deck: fixture.deck.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TooLongName: Story = {
  args: {
    deck: fixture.deck.tooLongName,
  },
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
