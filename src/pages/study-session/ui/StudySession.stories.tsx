/**
 * @file Defines Storybook examples for the Study Session presentation.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import * as fixture from "@/storybook/fixture";

import { StudySession as Template } from "./StudySession";

const meta = {
  title: "Pages/Study Session/StudySession",
  component: Template,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex h-dvh flex-col bg-canvas">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onExit: fn(),
    showSwipeButtonList: true,
    showController: true,
    frontTextSlot: <FrontText text={fixture.card.default.frontText} />,
    cardOverlaySlot: (
      <CardOverlay
        score={fixture.card.default.score}
        numberOfSeen={fixture.card.default.numberOfSeen}
        lastSeenAt={fixture.timestamp}
      />
    ),
    controller: { autoPlay: false, index: 3, numberOfCards: 24 },
    swipeButtonList: {},
    swipeOverlay: {
      onClickLeft: fn(),
      onClickRight: fn(),
      onClickUp: fn(),
      onClickDown: fn(),
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwipeFeedback: Story = {
  args: { swipeFeedback: "cardSwipeRight" },
};

export const ControlsHidden: Story = {
  args: {
    showSwipeButtonList: false,
    showController: false,
  },
};

export const LongAnswer: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(4)} variant="bare" />,
  },
};

export const CodeAnswer: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.code.default.repeat(40)} category="python" code variant="bare" />,
  },
};

export const MathAnswer: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={`${fixture.math.markdown}\n${fixture.math.block}`} category="math" variant="bare" />,
  },
};

export const AutoPlay: Story = {
  args: { controller: { autoPlay: true, index: 3, numberOfCards: 24 } },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "iphonex" } },
};

export const MobileLongAnswer: Story = {
  ...LongAnswer,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};

export const Dark: Story = {
  ...CodeAnswer,
  args: {
    ...CodeAnswer.args,
    backTextSlot: <CardView text={fixture.code.default.repeat(40)} category="python" code dark variant="bare" />,
  },
  globals: { theme: "dark" },
};

export const ReducedMotion: Story = {
  parameters: { chromatic: { prefersReducedMotion: "reduce" } },
};
