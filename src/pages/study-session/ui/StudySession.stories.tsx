/**
 * @file Defines Storybook examples for the Study Session presentation.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import * as fixture from "@/storybook/fixture";

import { StudySession as Template } from "./StudySession";

const meta = {
  title: "Pages/Study Session/StudySession",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onExit: fn(),
    showSwipeButtonList: true,
    frontTextSlot: <div>front text</div>,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwipeFeedback: Story = {
  args: { swipeFeedback: "cardSwipeRight" },
};

export const FrontText: Story = {
  args: {
    showSwipeButtonList: false,
    showController: true,
  },
};

export const FrontTextAll: Story = {
  args: {
    showSwipeButtonList: true,
    showController: true,
  },
};

export const BackText: Story = {
  args: {
    showBackText: true,
    backTextSlot: <div>this is a back text</div>,
  },
};

export const BackTextTooLong: Story = {
  args: {
    showBackText: true,
    backTextSlot: <div>{fixture.code.longtext}</div>,
  },
};

export const BackTextCode: Story = {
  args: {
    showBackText: true,
    backTextSlot: <pre>{fixture.code.longtext}</pre>,
  },
};
