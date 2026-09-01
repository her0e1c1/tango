import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { StudyHelpDialog, type StudyHelpDialogProps } from "./StudyHelpDialog";

const rows: StudyHelpDialogProps["rows"] = [
  { control: "cardSwipeUp", action: "GoToNextCardMastered" },
  { control: "cardSwipeDown", action: "GoToNextCardNotMastered" },
  { control: "cardSwipeLeft", action: "GoToPrevCard" },
  { control: "cardSwipeRight", action: "GoToNextCard" },
  { control: "flip", action: "flip" },
  { control: "autoPlay", action: "autoPlay" },
  { control: "swipeButtons", action: "swipeButtonsVisible" },
  { control: "playbackControls", action: "playbackControlsVisible" },
  { control: "cardDetails", action: "cardDetails" },
  { control: "exit", action: "exit" },
];

const meta = {
  title: "Pages/Study Session/StudyHelpDialog",
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
