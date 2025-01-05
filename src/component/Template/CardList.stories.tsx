import type { Meta, StoryObj } from "@storybook/react";
import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { CardList as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Template/CardList",
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
    deck: fixture.deck.default,
    cards: fixture.cards.default,
    tags: fixture.tags.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Long: Story = {
  args: {
    tags: fixture.tags.toolong,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: {
    showCard: fixture.card.default,
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
    tags: fixture.tags.toolong,
    cards: fixture.cards.long,
  },
};
