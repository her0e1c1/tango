import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";
import { DeckCard as Template } from "@/features/deck/components/DeckCard";
import * as fixture from "@/shared/storybook/fixture";

const meta = {
  title: "Deck/DeckCard",
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

export const Inactive: Story = {};

export const WithStudyProgress: Story = {
  args: {
    studyProgress: {
      currentIndex: 0,
      cardCount: 3,
    },
  },
};

export const Active: Story = WithStudyProgress;

export const TooLongName: Story = {
  args: {
    deck: fixture.deck.tooLongName,
  },
};

export const LongTitle: Story = TooLongName;

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};

export const MobileLight: Story = IphoneX;

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};
