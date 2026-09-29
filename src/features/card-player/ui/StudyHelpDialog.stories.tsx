import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { StudyHelpDialog, type StudyHelpDialogProps } from "./StudyHelpDialog";

const rows: StudyHelpDialogProps["rows"] = [
  { control: "cardSwipeUp", action: "RateGood" },
  { control: "cardSwipeDown", action: "RateAgain" },
  { control: "cardSwipeLeft", action: "RateEasy" },
  { control: "cardSwipeRight", action: "GoToNextCard" },
  { control: "flip", action: "flip" },
  { control: "autoPlay", action: "autoPlay" },
  { control: "swipeButtons", action: "swipeButtonsVisible" },
  { control: "playbackControls", action: "playbackControlsVisible" },
  { control: "skipControls", action: "skipControlsVisible" },
  { control: "cardDetails", action: "cardDetails" },
  { control: "exit", action: "exit" },
];

const meta = {
  title: "Features/Card Player/StudyHelpDialog",
  component: StudyHelpDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    rows,
    restoreTriggerFocus: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof StudyHelpDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};

export const Japanese: Story = {
  parameters: { locale: "ja" },
};

export const UnavailableControls: Story = {
  args: {
    rows: [
      { control: "autoPlay", action: "autoPlayUnavailable" },
      { control: "playbackControls", action: "playbackControlsUnavailable" },
    ],
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  ...English,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...English,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  parameters: { locale: "ja" },
  args: {
    rows: [
      ...rows.filter((row) => row.control !== "autoPlay" && row.control !== "playbackControls"),
      ...(UnavailableControls.args?.rows ?? []),
    ],
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...English,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
