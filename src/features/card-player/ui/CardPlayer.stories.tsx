import * as React from "react";
import { useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CardView, FrontText } from "@/entities/card";
import * as fixture from "@/storybook/fixture";
import { ToastViewport } from "@/shared/ui/toast";
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

export const Default: Story = {};

export const HelpOpen: Story = {
  args: { help: { ...meta.args.help, open: true } },
};

export const SwipeControlsHidden: Story = {
  args: { showSwipeControls: false },
};

export const PlaybackControlsHidden: Story = {
  args: { showPlaybackControls: false },
};

export const CardDetailsHidden: Story = {
  args: { showCardDetails: false },
};

export const ControlsHidden: Story = {
  args: {
    showSwipeControls: false,
    showPlaybackControls: false,
  },
};

export const PlaybackUnavailable: Story = {
  args: { playbackControlsAvailable: false },
};

export const LongAnswer: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(4)} variant="bare" />,
  },
};

export const AnswerSwipeOverlays: Story = {
  args: {
    showBackText: true,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(20)} variant="bare" />,
    backTextOverlay: { onClickLeft: fn(), onClickRight: fn() },
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

export const Mobile320ActionsOpen: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[aria-label="Open card actions"]')?.click();
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const MobileSafeArea: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
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
};

export const DeckViewingAnswer: Story = {
  args: {
    ...DeckViewing.args,
    ...LongAnswer.args,
    backTextSlot: <CardView text={fixture.card.long.backText.repeat(20)} variant="bare" />,
    answerLabel: "Card answer",
    allowBackHorizontalSwipe: true,
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
};

export const ViewEditLinkNarrow: Story = {
  ...ViewEditLink,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const ViewEditLinkMobile: Story = {
  ...ViewEditLink,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const ViewModeLongFront: Story = {
  args: {
    viewMode: true,
    frontTextSlot: <FrontText viewMode text={fixture.card.toolong.frontText.repeat(30)} />,
  },
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
};

export const ReadingSpace: Story = {
  args: { viewMode: true, frontTextSlot: <FrontText viewMode text="Readable front text" /> },
};

export const AnswerChrome: Story = {
  args: { ...LongAnswer.args, editLink: { visible: true, onToggle: fn(), element: <a href="#edit">Edit card</a> } },
};
export const AnswerChromeMobile: Story = {
  ...AnswerChrome,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const NoEditOperation: Story = {};

export const ToolbarRequests: Story = {
  args: { showSkipControls: true, onToggleSkipControls: fn() },
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
};

export const UnavailablePlaybackExplanation: Story = {
  args: { playbackControlsAvailable: false, showPlaybackControls: false, showSwipeControls: false },
};

export const PlaybackOnly: Story = {
  args: { showSwipeControls: false },
};
export const SwipeOnly: Story = {
  args: { showPlaybackControls: false },
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
};

export const UnstudiedDetails: Story = {};
export const RatedDetails: Story = {
  args: { cardOverlaySlot: <CardOverlay fsrs={{ difficulty: 8, lastReviewedAt: fixture.timestamp }} /> },
};

export const ReadingGestures: Story = {
  args: {
    viewMode: true,
    frontTextSlot: <FrontText viewMode text={fixture.card.toolong.frontText.repeat(30)} />,
    onSwipeUp: fn(),
    onSwipeLeft: fn(),
    swipeButtonList: { onClickLeft: fn() },
  },
};
export const AllowedAnswerGestures: Story = {
  args: { ...LongAnswer.args, viewMode: true, allowBackHorizontalSwipe: true, onAnswerClick: fn(), onSwipeLeft: fn() },
};
export const DisallowedAnswerGestures: Story = {
  args: {
    ...LongAnswer.args,
    allowBackHorizontalSwipe: false,
    onSwipeUp: fn(),
    onSwipeLeft: fn(),
    onAnswerClick: fn(),
  },
};
export const FrontSwipeWithoutButtons: Story = {
  args: { showSwipeControls: false, onSwipeUp: fn() },
};
export const FrontMouseGestures: Story = {
  args: { onSwipeUp: fn(), onAnswerClick: fn() },
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
};
export const ReadingShortcutVisibility: Story = {
  args: { viewMode: true },
  render: (args) => <DisplaySettingsExample {...args} />,
};
function shortcutsStory(help: boolean, view: boolean, edit: boolean): Story {
  return {
    args: {
      showHelp: help,
      showViewMode: view,
      editLink: { visible: edit, onToggle: fn(), element: <a href="#edit">Edit card</a> },
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
};
export const HelpWithNotification: Story = {
  render: (args) => (
    <React.StrictMode>
      <InteractiveHelp {...args} />
      <ToastViewport />
    </React.StrictMode>
  ),
};

export const Tablet: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[aria-label="Open card actions"]')?.click();
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
