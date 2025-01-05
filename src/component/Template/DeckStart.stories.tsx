import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DeckStart as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Template/DeckStart",
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
    config: fixture.config.default,
    cardsLength: 123,
    deckStartForm: {
      deck: fixture.deck.default,
      tags: fixture.tags.default,
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Long: Story = {
  args: {
    deckStartForm: {
      deck: fixture.deck.tooLongName,
      tags: fixture.tags.toolong,
    },
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
    deckStartForm: {
      deck: fixture.deck.tooLongName,
      tags: fixture.tags.toolong,
    },
  },
};
