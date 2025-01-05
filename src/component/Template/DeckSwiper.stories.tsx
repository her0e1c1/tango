import type { Meta, StoryObj } from "@storybook/react";

import { DeckSwiper as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Template/DeckSwiper",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    showHeader: true,
    showSwipeButtonList: true,
    frontText: { text: "front text" },
    card: fixture.card.default,
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
    backText: { text: "this is a back text" },
  },
};

export const BackTextTooLong: Story = {
  args: {
    showBackText: true,
    backText: { text: fixture.code.longtext },
  },
};

export const BackTextCode: Story = {
  args: {
    showBackText: true,
    backText: { text: fixture.code.longtext, category: "python" },
  },
};
