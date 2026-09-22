import { useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { CardView, FrontText } from "@/entities/card";
import * as fixture from "@/storybook/fixture";
import { Layout } from "@/shared/ui/layout";

import { CardOverlay } from "./CardOverlay";
import { CardPlayer, type CardPlayerProps } from "./CardPlayer";

const meta = {
  title: "Features/Card Player/CardPlayer",
  component: CardPlayer,
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
    viewMode: false,
    onToggleViewMode: fn(),
    onBack: fn(),
    onToggleCardDetails: fn(),
    onToggleHelp: fn(),
    onToggleSwipeControls: fn(),
    onTogglePlaybackControls: fn(),
    showSwipeControls: true,
    showViewMode: true,
    onToggleShowViewMode: fn(),
    showHelp: true,
    showPlaybackControls: true,
    showCardDetails: true,
    playbackControlsAvailable: true,
    help: {
      open: false,
      rows: [{ control: "cardSwipeUp", action: "RateGood" }],
      onOpen: fn(),
      onClose: fn(),
    },
    frontTextSlot: <FrontText text={fixture.card.default.frontText} />,
    cardOverlaySlot: <CardOverlay fsrs={null} />,
    controller: { autoPlay: false, index: 3, numberOfCards: 24 },
    swipeButtonList: { disabledDirections: { cardSwipeLeft: true } },
  },
} satisfies Meta<typeof CardPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectFrontTextCentered = async (canvasElement: HTMLElement, expectedOffset = 0) => {
  const frontText = canvasElement.querySelector<HTMLElement>("#frontText > *");
  await expect(frontText).not.toBeNull();
  if (frontText === null) return;

  const frontTextBounds = frontText.getBoundingClientRect();
  const frontTextCenter = frontTextBounds.top + frontTextBounds.height / 2;
  await expect(Math.abs(frontTextCenter - window.innerHeight / 2 - expectedOffset)).toBeLessThan(1);
};

const centeredFrontTextPlay: Story["play"] = async ({ canvasElement }) => {
  await expectFrontTextCentered(canvasElement);
};

export const Default: Story = {
  play: centeredFrontTextPlay,
};

export const HelpOpen: Story = {
  args: { help: { ...meta.args.help, open: true } },
};

export const SwipeControlsHidden: Story = {
  args: { showSwipeControls: false },
  play: centeredFrontTextPlay,
};

export const PlaybackControlsHidden: Story = {
  args: { showPlaybackControls: false },
  play: centeredFrontTextPlay,
};

export const CardDetailsHidden: Story = {
  args: { showCardDetails: false },
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
    const studyActions = canvasElement.querySelector<HTMLElement>("[aria-label='Card actions']");

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

    swipeLeft.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: answer.clientHeight }));
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

export const Mobile320ActionsOpen: Story = {
  globals: { viewport: { value: "iphone5", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));

    const backBounds = canvas.getByRole("button", { name: "Back to deck list" }).getBoundingClientRect();
    const actionsBounds = canvas.getByRole("group", { name: "Card actions" }).getBoundingClientRect();
    const cardOverlay = canvasElement.querySelector<HTMLElement>("[data-study-card-overlay]");
    await expect(cardOverlay).not.toBeNull();
    await expect(actionsBounds.top).toBeGreaterThanOrEqual(backBounds.bottom);
    await expect(actionsBounds.right).toBeLessThanOrEqual(canvasElement.getBoundingClientRect().right);
    if (cardOverlay !== null) await expect(cardOverlay).not.toBeVisible();
  },
};

export const MobileSafeArea: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvasElement }) => {
    const studySession = canvasElement.querySelector<HTMLElement>("[style*='--study-safe-area-top']");
    await expect(studySession).not.toBeNull();
    if (studySession === null) return;

    studySession.style.setProperty("--study-safe-area-top", "47px");
    studySession.style.setProperty("--study-safe-area-bottom", "34px");
    await expectFrontTextCentered(canvasElement, (34 - 47) / 2);
  },
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

export const DeckViewing: Story = {
  args: {
    allowBackHorizontalSwipe: true,
    answerLabel: "Card answer",
    controller: { ...meta.args.controller, index: 0, progressLabel: "Viewing progress" },
    help: {
      ...meta.args.help,
      title: "Viewing controls",
      triggerLabel: "Open viewing help",
      description: "Browse cards without changing learning progress.",
      rows: [
        { control: "cardSwipeLeft", action: "previousCard" },
        { control: "cardSwipeRight", action: "GoToNextCard" },
        { control: "cardSwipeUp", action: "DoNothing" },
        { control: "cardSwipeDown", action: "DoNothing" },
      ],
    },
    swipeButtonList: {
      disabledDirections: { cardSwipeUp: true, cardSwipeDown: true },
      labels: { cardSwipeLeft: "Previous card", cardSwipeRight: "Next card" },
      onClickLeft: fn(),
      onClickRight: fn(),
    },
  },
  play: async ({ args, canvasElement }) => {
    await expectFrontTextCentered(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Swipe up" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Swipe down" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Next card" }));
    await expect(args.swipeButtonList?.onClickRight).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("slider", { name: "Viewing progress" })).toHaveValue("0");
  },
};

export const DeckViewingAnswer: Story = {
  args: {
    ...DeckViewing.args,
    ...LongAnswer.args,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(20)} variant="bare" />,
    answerLabel: "Card answer",
    allowBackHorizontalSwipe: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const answer = canvas.getByRole("region", { name: "Card answer" });
    await expect(answer.scrollHeight).toBeGreaterThan(answer.clientHeight);
    await expect(canvas.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
  },
};

export const Japanese: Story = { parameters: { locale: "ja" } };

export const WithActionSlot: Story = { args: { actionSlot: <button type="button">Skip</button> } };

function ViewEditLinkStory(args: CardPlayerProps) {
  const [visible, setVisible] = useState(true);
  return (
    <CardPlayer
      {...args}
      editLink={{
        visible,
        onToggle: () => setVisible((value) => !value),
        element: (
          <a
            href="#edit"
            aria-label="Edit card"
            className="pointer-events-auto inline-flex size-touch items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <AiOutlineEdit aria-hidden="true" className="text-xl" />
          </a>
        ),
      }}
    />
  );
}

export const ViewEditLink: Story = {
  render: (args) => <ViewEditLinkStory {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
    const overlay = canvasElement.querySelector<HTMLElement>("[data-study-card-overlay]");
    await expect(overlay).not.toBeNull();
    if (window.innerWidth <= 439) await expect(overlay).not.toBeVisible();
    const toggle = canvas.getByRole("button", { name: "Edit link" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    const buttons = [
      "Back to deck list",
      "Swipe controls",
      "Playback controls",
      "Card details",
      "Edit link",
      "Help button",
      "Close card actions",
    ].map((name) => canvas.getByRole("button", { name }));
    for (const [i, current] of buttons.entries()) {
      const a = current.getBoundingClientRect();
      for (const button of buttons.slice(i + 1)) {
        const b = button.getBoundingClientRect();
        await expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
      }
    }
    await userEvent.click(toggle);
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
    await userEvent.click(canvas.getByRole("button", { name: "Edit link" }));
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
  },
};

export const ViewEditLinkNarrow: Story = {
  ...ViewEditLink,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const ViewEditLinkMobile: Story = {
  ...ViewEditLink,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

const readingPlay: Story["play"] = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const surface = canvas.getByRole("region", { name: "Card front text" });
  await expect(surface).toHaveFocus();
  await expect(surface.scrollHeight).toBeGreaterThan(surface.clientHeight);
  surface.scrollTop = surface.scrollHeight;
  await expect(surface.scrollTop + surface.clientHeight).toBeGreaterThanOrEqual(surface.scrollHeight - 1);
  const controls = canvas.getByRole("button", { name: "Play" });
  await expect(surface.getBoundingClientRect().bottom).toBeLessThanOrEqual(controls.getBoundingClientRect().top);
  const toggle = canvas.getByRole("button", { name: "View mode" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle.getBoundingClientRect().bottom).toBeLessThanOrEqual(surface.getBoundingClientRect().top);
  await userEvent.click(toggle);
  await expect(args.onToggleViewMode).toHaveBeenCalledOnce();
};

export const ViewModeLongFront: Story = {
  args: {
    viewMode: true,
    frontTextSlot: <FrontText viewMode text={fixture.card.toolong.frontText.repeat(30)} />,
  },
  play: readingPlay,
};

export const ViewModeMobile: Story = {
  ...ViewModeLongFront,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const ViewModeMath: Story = {
  ...ViewModeLongFront,
  args: {
    viewMode: true,
    frontTextSlot: <FrontText viewMode text={Array(20).fill(fixture.math.block).join("\n\n")} category="math" />,
  },
};
