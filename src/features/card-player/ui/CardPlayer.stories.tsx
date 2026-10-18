import * as React from "react";
import { useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";

import { CardView, FrontText } from "@/entities/card";
import * as fixture from "@/storybook/fixture";
import { showToast, ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { Layout } from "@/shared/ui/layout";

import { CardOverlay } from "./CardOverlay";
import { CardPlayer, type CardPlayerProps } from "./CardPlayer";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
  // Given: Prepare `frontText` and any shared test state below.
  const frontText = canvasElement.querySelector<HTMLElement>("#frontText > *");
  // Then: Verify the expected result in the assertions below.
  await expect(frontText).not.toBeNull();
  if (frontText === null) return;

  const frontTextBounds = frontText.getBoundingClientRect();
  const frontTextCenter = frontTextBounds.top + frontTextBounds.height / 2;
  await expect(Math.abs(frontTextCenter - window.innerHeight / 2 - expectedOffset)).toBeLessThan(1);
};

const centeredFrontTextPlay: Story["play"] = async ({ canvasElement }) => {
  // Given: Use this case's inputs and any shared test setup.
  // When: Observe the prepared result through the following checks.
  // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const answer = canvasElement.querySelector<HTMLElement>("pre");
    const swipeOverlays = canvasElement.querySelectorAll<HTMLElement>(
      "[aria-label='Swipe left'], [aria-label='Swipe right'], [aria-label='Swipe up'], [aria-label='Swipe down']"
    );
    const studyActions = canvasElement.querySelector<HTMLElement>("[aria-label='Card actions']");

    // When: Storybook renders this scenario with its configured args and parameters.
    // Then: Verify the expected result in the assertions below.
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
  play: async ({ args, canvasElement, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-09 Forward edge wheel input without requesting study actions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
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

      // When: Exercise `swipeLeft.dispatchEvent` with the prepared inputs.
      swipeLeft.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: answer.clientHeight })
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      // Then: Verify the expected result in the assertions below.
      await expect(answer.scrollTop).toBeGreaterThan(0);
      await expect(swipeLeft.getBoundingClientRect().top).toBe(swipeLeftTop);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(swipeLeft);
      // Then: Verify the expected result in the assertions below.
      await expect(onClickLeft).toHaveBeenCalledOnce();
    });
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const canvas = within(canvasElement);
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));

    const backBounds = canvas.getByRole("button", { name: "Back to deck list" }).getBoundingClientRect();
    const actionsBounds = canvas.getByRole("group", { name: "Card actions" }).getBoundingClientRect();
    const cardOverlay = canvasElement.querySelector<HTMLElement>("[data-study-card-overlay]");
    // Then: Verify the expected result in the assertions below.
    await expect(cardOverlay).not.toBeNull();
    await expect(actionsBounds.top).toBeGreaterThanOrEqual(backBounds.bottom);
    await expect(actionsBounds.right).toBeLessThanOrEqual(canvasElement.getBoundingClientRect().right);
    if (cardOverlay !== null) await expect(cardOverlay).not.toBeVisible();
  },
};

export const MobileSafeArea: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvasElement }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const studySession = canvasElement.querySelector<HTMLElement>("[style*='--study-safe-area-top']");
    // When: Storybook renders this scenario with its configured args and parameters.
    // Then: Verify the expected result in the assertions below.
    await expect(studySession).not.toBeNull();
    if (studySession === null) return;

    // When: Exercise `studySession.style.setProperty` with the prepared inputs.
    studySession.style.setProperty("--study-safe-area-top", "47px");
    studySession.style.setProperty("--study-safe-area-bottom", "34px");
    // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const markdown = canvasElement.querySelector<HTMLElement>(".markdown-body");
    // When: Storybook renders this scenario with its configured args and parameters.
    // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await expectFrontTextCentered(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Swipe up" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Swipe down" })).toBeDisabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Next card" }));
    // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const canvas = within(canvasElement);
    const answer = canvas.getByRole("region", { name: "Card answer" });
    // When: Storybook renders this scenario with its configured args and parameters.
    // Then: Verify the expected result in the assertions below.
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
  play: async ({ canvasElement, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-05 Toggle the edit shortcut and restore toolbar focus", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const canvas = within(canvasElement);
      await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
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
        // Given: Prepare `a` and any shared test state below.
        // Then: Compare every pair of rendered control bounds.
        const a = current.getBoundingClientRect();
        for (const button of buttons.slice(i + 1)) {
          // Given: Prepare `b` and any shared test state below.
          const b = button.getBoundingClientRect();
          // Then: Verify the expected result in the assertions below.
          await expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
        }
      }
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).not.toBePressed();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Open card actions" })).toHaveFocus();
      await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      await userEvent.click(canvas.getByRole("button", { name: "Edit link" }));
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Open card actions" })).toHaveFocus();
      await expect(canvas.getByRole("link", { name: "Edit card" })).toBeVisible();
    });
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
  // Given: Prepare `canvas`, `surface`, `controls` and any shared test state below.
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
  // When: Exercise `userEvent.click` with the prepared inputs.
  await userEvent.click(toggle);
  // Then: Verify the expected result in the assertions below.
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

export const ReadingSelection: Story = {
  args: { viewMode: true, frontTextSlot: <FrontText viewMode text="Select this front text" /> },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-02 Keep reading while text is selected", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const text = canvas.getByText("Select this front text");
      const selection = window.getSelection();
      if (!selection) throw new Error("Browser selection is unavailable");
      const range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `fireEvent.click` with the prepared inputs.
        await fireEvent.click(text);
        // Then: Verify the expected result in the assertions below.
        await expect(args.onToggleViewMode).not.toHaveBeenCalled();
        // When: Exercise `selection.removeAllRanges` with the prepared inputs.
        selection.removeAllRanges();
        await fireEvent.click(text);
        // Then: Verify the expected result in the assertions below.
        await expect(args.onToggleViewMode).toHaveBeenCalledOnce();
      } finally {
        selection.removeAllRanges();
      }
    });
  },
};

export const ReadingSpace: Story = {
  args: { viewMode: true, frontTextSlot: <FrontText viewMode text="Readable front text" /> },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-03 Distinguish Space from an explicit text tap", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByRole("region", { name: "Card front text" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(args.onToggleViewMode).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Readable front text"));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onToggleViewMode).toHaveBeenCalledOnce();
    });
  },
};

export const AnswerChrome: Story = {
  args: { ...LongAnswer.args, editLink: { visible: true, onToggle: fn(), element: <a href="#edit">Edit card</a> } },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-06 Hide the edit link on the answer", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-CARD-PLAYER-07 Show the focusable answer without study chrome", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const answer = canvas.getByRole("region", { name: "Study answer" });
      await expect(answer).toBeVisible();
      // When: Exercise `answer.focus` with the prepared inputs.
      answer.focus();
      // Then: Verify the expected result in the assertions below.
      await expect(answer).toHaveFocus();
      for (const name of [
        "Back to deck list",
        "Open card actions",
        "Close card actions",
        "Play",
        "Pause",
        "Swipe left",
        "Swipe right",
        "Swipe up",
        "Swipe down",
      ])
        await expect(canvas.queryByRole("button", { name })).not.toBeInTheDocument();
      await expect(canvas.queryByText("not studied yet")).not.toBeInTheDocument();
      await expect(canvas.queryByText(fixture.card.default.frontText)).not.toBeInTheDocument();
    });
  },
};
export const AnswerChromeMobile: Story = {
  ...AnswerChrome,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const NoEditOperation: Story = {
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-06 Omit edit settings without an edit link", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Edit link" })).not.toBeInTheDocument();
    });
  },
};

export const ToolbarRequests: Story = {
  args: { showSkipControls: true, onToggleSkipControls: fn() },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-10 Request each toolbar action and restore focus", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const trigger = canvas.getByRole("button", { name: "Open card actions" });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(trigger);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close card actions" })).toHaveAttribute("aria-expanded", "true");
      await expect(canvas.queryByRole("button", { name: "Open study help" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Help button" })).toBePressed();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Back to deck list" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onBack).toHaveBeenCalledOnce();
      for (const [name, callback] of [
        ["Swipe controls", args.onToggleSwipeControls],
        ["Playback controls", args.onTogglePlaybackControls],
        ["Skip control", args.onToggleSkipControls],
        ["Card details", args.onToggleCardDetails],
      ] as const) {
        // Given: Prepare `button` and any shared test state below.
        // Then: Check the configured pressed state of each rendered control.
        const button = canvas.getByRole("button", { name });
        // Then: Verify the expected result in the assertions below.
        await expect(button).toBePressed();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(button);
        // Then: Verify the expected result in the assertions below.
        await expect(callback).toHaveBeenCalledOnce();
      }
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Open card actions" })).toHaveFocus();
      await expect(canvas.getByRole("button", { name: "Open study help" })).toBeVisible();
    });
  },
};

const StatefulReading = (args: CardPlayerProps) => {
  const [viewMode, setViewMode] = useState(args.viewMode);
  return (
    <CardPlayer
      {...args}
      viewMode={viewMode}
      onToggleViewMode={() => {
        args.onToggleViewMode();
        setViewMode(!viewMode);
      }}
    />
  );
};
export const ReadingToggle: Story = {
  render: (args) => <StatefulReading {...args} />,
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-12 Reflect the current reading mode", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const toggle = canvas.getByRole("button", { name: "View mode" });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await expect(toggle).toHaveAccessibleDescription("Enter view mode");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onToggleViewMode).toHaveBeenCalledOnce();
      await expect(toggle).toBePressed();
      await expect(toggle).toHaveAccessibleDescription("Exit view mode");
    });
  },
};

export const UnavailablePlaybackExplanation: Story = {
  args: { playbackControlsAvailable: false, showPlaybackControls: false, showSwipeControls: false },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-16 Explain unavailable playback without activating it", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      const swipe = canvas.getByRole("button", { name: "Swipe controls" });
      // Then: Verify the expected result in the assertions below.
      await expect(swipe).toHaveAttribute("aria-pressed", "false");
      await expect(swipe).toHaveAccessibleDescription("Show swipe controls");
      const playback = canvas.getByRole("button", { name: "Playback controls" });
      // When: Exercise `playback.focus` with the prepared inputs.
      playback.focus();
      // Then: Verify the expected result in the assertions below.
      await expect(playback).toHaveFocus();
      await expect(playback).toHaveAttribute("aria-disabled", "true");
      const reason = "Playback controls unavailable because the card interval is set to 0";
      await expect(playback).toHaveAttribute("title", reason);
      await expect(playback).toHaveAccessibleDescription(reason);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(playback);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onTogglePlaybackControls).not.toHaveBeenCalled();
    });
  },
};

export const PlaybackOnly: Story = {
  args: { showSwipeControls: false },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-17 Display only playback when swipe controls are hidden", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Play" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    });
  },
};
export const SwipeOnly: Story = {
  args: { showPlaybackControls: false },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-17 Display only swipe controls when playback is hidden", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Swipe left" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    });
  },
};

const InteractiveHelp = (args: CardPlayerProps) => {
  const [open, setOpen] = useState(false);
  return (
    <CardPlayer {...args} help={{ ...args.help, open, onOpen: () => setOpen(true), onClose: () => setOpen(false) }} />
  );
};
export const HelpKeyboardContract: Story = {
  args: { help: { ...meta.args.help, rows: [...meta.args.help.rows, { control: "flip", action: "flip" }] } },
  render: (args) => <InteractiveHelp {...args} />,
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-07 Open a named and described help dialog", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open study help" }));
      const dialog = canvas.getByRole("dialog", { name: "Study controls" });
      // Then: Verify the expected result in the assertions below.
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAccessibleDescription(
        "Review the controls available for this study session and their current actions."
      );
      await expect(within(dialog).getByText("Arrow Up / Swipe Up")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
    });
    await step("STORYBOOK-STUDY-CONTROLS-08 Contain focus and return it on Escape", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab({ shift: true });
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Open study help" })).toHaveFocus();
    });
  },
};

export const UnstudiedDetails: Story = {
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-23 Distinguish unstudied cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("not studied yet", { exact: true })).toBeVisible();
      await expect(canvas.queryByText(/FSRS D:/)).not.toBeInTheDocument();
    });
  },
};
export const RatedDetails: Story = {
  args: { cardOverlaySlot: <CardOverlay fsrs={{ difficulty: 8, lastReviewedAt: fixture.timestamp }} /> },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-23 Display the supplied FSRS difficulty", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText(/FSRS D: 8/)).toBeVisible();
      await expect(canvas.queryByText("not studied yet", { exact: true })).not.toBeInTheDocument();
    });
  },
};

function touchSwipe(target: HTMLElement, endX: number, endY: number) {
  const start = new Touch({ identifier: 1, target, clientX: 200, clientY: 200 });
  const end = new Touch({ identifier: 1, target, clientX: endX, clientY: endY });
  target.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start] }));
  target.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [end] }));
  target.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [end] }));
}
function mouseSwipe(target: HTMLElement, endX: number, endY: number, button = 0) {
  // Dispatch the browser's trailing click in the same task as mouseup, before its suppression timer expires.
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button, clientX: 200, clientY: 200 }));
  document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, button, clientX: endX, clientY: endY }));
  document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button, clientX: endX, clientY: endY }));
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, button }));
}

export const ReadingGestures: Story = {
  args: {
    viewMode: true,
    frontTextSlot: <FrontText viewMode text={fixture.card.toolong.frontText.repeat(30)} />,
    onSwipeUp: fn(),
    onSwipeLeft: fn(),
    swipeButtonList: { onClickLeft: fn() },
  },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-01 Keep reading gestures separate from explicit study actions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const surface = canvas.getByRole("region", { name: "Card front text" });
      for (const [x, y] of [
        [200, 40],
        [200, 360],
        [40, 200],
        [360, 200],
      ] as const)
        touchSwipe(surface, x, y);
      mouseSwipe(surface, 200, 40);
      await expect(args.onSwipeUp).not.toHaveBeenCalled();
      await expect(args.onSwipeLeft).not.toHaveBeenCalled();
      await expect(args.onToggleViewMode).not.toHaveBeenCalled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Swipe left" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.swipeButtonList?.onClickLeft).toHaveBeenCalledOnce();
    });
  },
};
export const AllowedAnswerGestures: Story = {
  args: { ...LongAnswer.args, viewMode: true, allowBackHorizontalSwipe: true, onAnswerClick: fn(), onSwipeLeft: fn() },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-04 Preserve explicitly permitted answer actions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const answer = canvas.getByRole("region", { name: "Study answer" });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(answer);
      touchSwipe(answer, 40, 200);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onAnswerClick).toHaveBeenCalledOnce();
      await expect(args.onSwipeLeft).toHaveBeenCalledOnce();
    });
  },
};
export const DisallowedAnswerGestures: Story = {
  args: {
    ...LongAnswer.args,
    allowBackHorizontalSwipe: false,
    onSwipeUp: fn(),
    onSwipeLeft: fn(),
    onAnswerClick: fn(),
  },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const answer = canvas.getByRole("region", { name: "Study answer" });
    await step("STORYBOOK-CARD-PLAYER-18 Ignore unpermitted answer swipes", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `touchSwipe` with the prepared inputs.
      touchSwipe(answer, 40, 200);
      touchSwipe(answer, 200, 40);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSwipeLeft).not.toHaveBeenCalled();
      await expect(args.onSwipeUp).not.toHaveBeenCalled();
    });
    await step("STORYBOOK-CARD-PLAYER-22 Suppress the click following an answer drag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `mouseSwipe` with the prepared inputs.
      mouseSwipe(answer, 40, 200);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSwipeLeft).not.toHaveBeenCalled();
      await expect(args.onAnswerClick).not.toHaveBeenCalled();
    });
  },
};
export const FrontSwipeWithoutButtons: Story = {
  args: { showSwipeControls: false, onSwipeUp: fn() },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-19 Swipe independently of button visibility", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `touchSwipe` with the prepared inputs.
      touchSwipe(canvas.getByText(fixture.card.default.frontText), 200, 40);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSwipeUp).toHaveBeenCalledOnce();
    });
  },
};
export const FrontMouseGestures: Story = {
  args: { onSwipeUp: fn(), onAnswerClick: fn() },
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const front = canvas.getByText(fixture.card.default.frontText);
    await step("STORYBOOK-CARD-PLAYER-21 Ignore middle and right button drags", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `mouseSwipe` with the prepared inputs.
      mouseSwipe(front, 200, 40, 1);
      mouseSwipe(front, 200, 40, 2);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSwipeUp).not.toHaveBeenCalled();
    });
    await step("STORYBOOK-CARD-PLAYER-20 Do not turn the trailing drag click into another action", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `mouseSwipe` with the prepared inputs.
      mouseSwipe(front, 200, 40);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSwipeUp).toHaveBeenCalledOnce();
      await expect(args.onAnswerClick).not.toHaveBeenCalled();
      await expect(args.onToggleViewMode).not.toHaveBeenCalled();
    });
  },
};

function DisplaySettingsExample(args: CardPlayerProps) {
  const [help, setHelp] = useState(args.showHelp);
  const [view, setView] = useState(args.showViewMode);
  const [details, setDetails] = useState(args.showCardDetails);
  return (
    <CardPlayer
      {...args}
      showHelp={help}
      onToggleHelp={() => {
        args.onToggleHelp();
        setHelp(!help);
      }}
      showViewMode={view}
      onToggleShowViewMode={() => {
        args.onToggleShowViewMode();
        setView(!view);
      }}
      showCardDetails={details}
      onToggleCardDetails={() => {
        args.onToggleCardDetails();
        setDetails(!details);
      }}
    />
  );
}
export const RestoreHelpShortcut: Story = {
  render: (args) => <DisplaySettingsExample {...args} />,
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-11 Retain the help visibility control", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      const toggle = canvas.getByRole("button", { name: "Help button" });
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).not.toBePressed();
      await expect(toggle).toHaveAccessibleDescription("Show help button");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(args.onToggleHelp).toHaveBeenCalledTimes(2);
      await expect(toggle).toBePressed();
    });
  },
};
export const ReadingShortcutVisibility: Story = {
  args: { viewMode: true },
  render: (args) => <DisplaySettingsExample {...args} />,
  play: async ({ args, canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-13 Separate reading mode from shortcut visibility", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      for (const visible of [false, true]) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
        await userEvent.click(canvas.getByRole("button", { name: "View mode" }));
        await userEvent.keyboard("{Escape}");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("button", { name: "Open card actions" })).toHaveFocus();
        if (visible)
          await expect(canvas.getByRole("button", { name: "View mode" })).toHaveAccessibleDescription("Exit view mode");
        else await expect(canvas.queryByRole("button", { name: "View mode" })).not.toBeInTheDocument();
      }
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(args.onToggleShowViewMode).toHaveBeenCalledTimes(2);
      await expect(args.onToggleViewMode).not.toHaveBeenCalled();
    });
  },
};
function shortcutsStory(help: boolean, view: boolean, edit: boolean): Story {
  return {
    args: {
      showHelp: help,
      showViewMode: view,
      editLink: { visible: edit, onToggle: fn(), element: <a href="#edit">Edit card</a> },
    },
    play: async ({ args, canvas, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-CARD-PLAYER-14 Respect shortcut visibility combinations", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        for (let pass = 0; pass < 2; pass++) {
          // Given: Prepare `group` and any shared test state below.
          const group = within(canvas.getByTestId("toolbar-shortcuts"));
          await expect(group.getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
            "Open card actions",
            ...(help ? ["Open study help"] : []),
            ...(view ? ["View mode"] : []),
          ]);
          await expect(canvas.queryByRole("link", { name: "Edit card" }) !== null).toBe(edit);
          // When: Exercise `userEvent.click` with the prepared inputs.
          await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
          for (const [name, callback] of [
            ["Help button", args.onToggleHelp],
            ["View mode", args.onToggleShowViewMode],
            ["Edit link", args.editLink?.onToggle],
          ] as const) {
            // Given: Use the current iteration or branch inputs from the enclosing case.
            // When: Exercise `userEvent.click` with the prepared inputs.
            await userEvent.click(canvas.getByRole("button", { name }));
            // Then: Verify the expected result in the assertions below.
            await expect(callback).toHaveBeenCalledTimes(pass + 1);
          }
          await expect(canvas.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
          // When: Exercise `userEvent.keyboard` with the prepared inputs.
          await userEvent.keyboard("{Escape}");
          // Then: Verify the expected result in the assertions below.
          await expect(canvas.getByRole("button", { name: "Open card actions" })).toHaveFocus();
        }
      });
    },
  };
}
export const AllShortcuts = shortcutsStory(true, true, true);
export const ViewAndEditShortcuts = shortcutsStory(false, true, true);
export const HelpAndViewShortcuts = shortcutsStory(true, true, false);
export const ViewShortcut = shortcutsStory(false, true, false);
export const HelpAndEditShortcuts = shortcutsStory(true, false, true);
export const NoShortcuts = shortcutsStory(false, false, false);
export const ToggleDetails: Story = {
  render: (args) => <DisplaySettingsExample {...args} />,
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-PLAYER-15 Toggle all card details", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
      const toggle = canvas.getByRole("button", { name: "Card details" });
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("not studied yet")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).not.toBePressed();
      await expect(toggle).toHaveAccessibleDescription("Show card details");
      await expect(canvas.queryByText("not studied yet")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(toggle);
      // Then: Verify the expected result in the assertions below.
      await expect(toggle).toBePressed();
      await expect(toggle).toHaveAccessibleDescription("Hide card details");
      await expect(canvas.getByText("not studied yet")).toBeVisible();
    });
  },
};
export const HelpWithNotification: Story = {
  beforeEach: () => {
    dismissToast();
    return () => dismissToast();
  },
  render: (args) => (
    <React.StrictMode>
      <InteractiveHelp {...args} />
      <ToastViewport />
    </React.StrictMode>
  ),
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-CONTROLS-09 Keep focus in help when a background notification disappears", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      showToast({ messageKey: "Persistent warning", durationMs: null, dismissible: true });
      await expect(await canvas.findByRole("button", { name: "Dismiss notification" })).toBeEnabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open study help" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
      // When: Exercise `dismissToast` with the prepared inputs.
      dismissToast();
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.getByRole("button", { name: "Close help" })).toHaveFocus());
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
    });
    await step("STORYBOOK-STUDY-CONTROLS-10 Restore notification interaction after closing help", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      showToast({ messageKey: "Persistent warning", durationMs: null, dismissible: true });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Open study help" }));
      await userEvent.click(canvas.getByRole("button", { name: "Close help" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByText("Persistent warning")).not.toBeInTheDocument();
    });
  },
};

export const Tablet: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Open card actions" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...ViewModeLongFront,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  args: { playbackControlsAvailable: false },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDarkAnswer: Story = {
  ...DarkCodeAnswer,
  args: { ...DarkCodeAnswer.args, backTextOverlay: { onClickLeft: fn(), onClickRight: fn() } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const LandscapeAnswer: Story = {
  args: AnswerSwipeOverlays.args ?? {},
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
