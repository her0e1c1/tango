import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import * as fixture from "@/storybook/fixture";
import { Layout } from "@/shared/ui/layout";

import { StudySession } from "./StudySession";

const meta = {
  title: "Pages/Study Session/StudySession",
  component: StudySession,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Layout fullscreen>
        <Story />
      </Layout>
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
} satisfies Meta<typeof StudySession>;

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
  play: async ({ canvasElement }) => {
    const answer = canvasElement.querySelector<HTMLElement>("pre");
    const swipeOverlays = canvasElement.querySelectorAll<HTMLElement>("[aria-label^='Swipe ']");
    const swipeOverlayStyles = Array.from(swipeOverlays, (overlay) => {
      const style = getComputedStyle(overlay);
      return { backgroundColor: style.backgroundColor, boxShadow: style.boxShadow };
    });

    await expect(answer).toBeVisible();
    await expect(swipeOverlays).toHaveLength(4);
    await expect(swipeOverlayStyles).toEqual(
      Array.from({ length: 4 }, () => ({ backgroundColor: "rgba(0, 0, 0, 0)", boxShadow: "none" }))
    );
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
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const MobileLongAnswer: Story = {
  ...LongAnswer,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const UnavailableSwipeActions: Story = {
  args: {
    showBackText: true,
    backTextSlot: <div className="h-full w-full">Back without swipe actions</div>,
    swipeOverlay: {},
  },
  play: async ({ canvasElement }) => {
    const answer = canvasElement.querySelector<HTMLElement>(".h-full.w-full");
    await expect(answer).not.toBeNull();
    if (answer === null) return;

    const bounds = answer.getBoundingClientRect();
    const leftEdgeTarget = document.elementFromPoint(bounds.left + 8, bounds.top + bounds.height / 2);
    await expect(leftEdgeTarget).toBe(answer);
  },
};

export const Dark: Story = {
  ...CodeAnswer,
  args: {
    ...CodeAnswer.args,
    backTextSlot: <CardView text={fixture.code.default.repeat(40)} category="python" code dark variant="bare" />,
  },
  globals: { theme: "dark" },
};

export const DarkMath: Story = {
  ...MathAnswer,
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    const markdown = canvasElement.querySelector<HTMLElement>(".markdown-body");
    await expect(markdown).not.toBeNull();
    if (markdown === null) return;

    const style = getComputedStyle(markdown);
    await expect(style.getPropertyValue("--fgColor-default").trim()).toBe(
      style.getPropertyValue("--calm-color-ink").trim()
    );
    await expect(style.getPropertyValue("--borderColor-muted").trim()).toBe(
      style.getPropertyValue("--calm-color-border").trim()
    );
  },
};
