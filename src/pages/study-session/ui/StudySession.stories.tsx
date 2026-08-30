import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { CardView, FrontText } from "@/entities/card";
import * as fixture from "@/storybook/fixture";
import { Layout } from "@/shared/ui/layout";

import { CardOverlay } from "./CardOverlay";
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
    onBack: fn(),
    onToggleSwipeControls: fn(),
    onTogglePlaybackControls: fn(),
    showSwipeControls: true,
    showPlaybackControls: true,
    playbackControlsAvailable: true,
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
  },
} satisfies Meta<typeof StudySession>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectFrontTextCentered = async (canvasElement: HTMLElement) => {
  const frontText = canvasElement.querySelector<HTMLElement>("#frontText > *");
  await expect(frontText).not.toBeNull();
  if (frontText === null) return;

  const frontTextBounds = frontText.getBoundingClientRect();
  const frontTextCenter = frontTextBounds.top + frontTextBounds.height / 2;
  await expect(Math.abs(frontTextCenter - window.innerHeight / 2)).toBeLessThan(1);
};

const centeredFrontTextPlay: Story["play"] = async ({ canvasElement }) => {
  await expectFrontTextCentered(canvasElement);
};

export const Default: Story = {
  play: centeredFrontTextPlay,
};

export const SwipeFeedback: Story = {
  args: { swipeFeedback: "cardSwipeRight" },
  play: centeredFrontTextPlay,
};

export const SwipeControlsHidden: Story = {
  args: { showSwipeControls: false },
  play: centeredFrontTextPlay,
};

export const PlaybackControlsHidden: Story = {
  args: { showPlaybackControls: false },
  play: centeredFrontTextPlay,
};

export const ControlsHidden: Story = {
  args: {
    showSwipeControls: false,
    showPlaybackControls: false,
  },
  play: centeredFrontTextPlay,
};

export const PlaybackUnavailable: Story = {
  args: { playbackControlsAvailable: false },
  play: centeredFrontTextPlay,
};

export const LongAnswer: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(4)} variant="bare" />,
  },
  play: async ({ canvasElement }) => {
    const answer = canvasElement.querySelector<HTMLElement>("pre");
    const swipeOverlays = canvasElement.querySelectorAll<HTMLElement>(
      "[aria-label='Swipe left'], [aria-label='Swipe right'], [aria-label='Swipe up'], [aria-label='Swipe down']"
    );
    const studyActions = canvasElement.querySelector<HTMLElement>("[aria-label='Study actions']");

    await expect(answer).toBeVisible();
    await expect(swipeOverlays).toHaveLength(0);
    await expect(studyActions).toBeNull();
  },
};

export const AnswerSwipeOverlays: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(20)} variant="bare" />,
    backTextOverlay: { onClickLeft: fn(), onClickRight: fn() },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const answer = canvas.getByRole("region", { name: "Study answer" });
    const swipeLeft = canvas.getByRole("button", { name: "Swipe left" });
    const swipeRight = canvas.getByRole("button", { name: "Swipe right" });
    const swipeLeftTop = swipeLeft.getBoundingClientRect().top;
    const onClickLeft = args.backTextOverlay?.onClickLeft;
    if (onClickLeft === undefined) throw new Error("Expected the left answer overlay action");

    await expect(answer).toBeVisible();
    await expect(swipeLeft).toBeVisible();
    await expect(swipeRight).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Swipe up" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Swipe down" })).not.toBeInTheDocument();

    answer.scrollTop = answer.scrollHeight;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    await expect(answer.scrollTop).toBeGreaterThan(0);
    await expect(swipeLeft.getBoundingClientRect().top).toBe(swipeLeftTop);
    await userEvent.click(swipeLeft);
    await expect(onClickLeft).toHaveBeenCalledOnce();
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
  play: centeredFrontTextPlay,
};

export const MobileLongAnswer: Story = {
  ...LongAnswer,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const DarkCodeAnswer: Story = {
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
