/**
 * @file Defines Storybook examples for Deck Swiper Template.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { BackText as BackTextComponent } from "@/features/card/components/BackText";
import { CardOverlay } from "@/features/card/components/CardOverlay";
import { FrontText as FrontTextComponent } from "@/features/card/components/FrontText";
import { DeckSwiperTemplate as Template } from "@/features/study/components/templates/DeckSwiperTemplate";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Study/DeckSwiperTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    showHeader: true,
    showSwipeButtonList: true,
    frontTextSlot: <FrontTextComponent text="front text" />,
    cardOverlaySlot: <CardOverlay card={fixture.card.default} />,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FrontText: Story = {
  args: {
    showHeader: false,
    showSwipeButtonList: false,
    showController: true,
  },
};

export const FrontTextAll: Story = {
  args: {
    showHeader: true,
    showSwipeButtonList: true,
    showController: true,
  },
};

export const BackText: Story = {
  args: {
    showBackText: true,
    backTextSlot: <BackTextComponent text="this is a back text" />,
  },
};

export const BackTextTooLong: Story = {
  args: {
    showBackText: true,
    backTextSlot: <BackTextComponent text={fixture.code.longtext} />,
  },
};

export const BackTextCode: Story = {
  args: {
    showBackText: true,
    backTextSlot: <BackTextComponent text={fixture.code.longtext} category="python" code />,
  },
};
