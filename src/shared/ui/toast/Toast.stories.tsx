import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

import type { ToastTone } from ".";
import { ToastViewport } from "./Toast";
import { dismissToast, showToast } from "./model";

interface ToastStoryProps {
  message: string;
  tone: ToastTone;
  dismissible?: boolean;
}

const useStoryToast = (props: ToastStoryProps) => {
  React.useEffect(() => {
    const id = showToast({
      message: props.message,
      tone: props.tone,
      durationMs: null,
      dismissible: props.dismissible ?? true,
    });
    return () => dismissToast(id);
  }, [props.dismissible, props.message, props.tone]);
};

const ToastStory = (props: ToastStoryProps) => {
  useStoryToast(props);
  return <ToastViewport />;
};

const meta = {
  title: "Shared/Feedback/Toast",
  component: ToastStory,
  tags: ["autodocs"],
  args: {
    message: "Changes saved",
    tone: "neutral",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning", message: "Connection is unstable" } };
export const ErrorState: Story = {
  args: { tone: "error", message: "Unable to save changes." },
};
export const LongMessage: Story = {
  args: {
    tone: "error",
    message:
      "The operation could not be completed because the connection was interrupted. Check your connection and try again.",
  },
};
export const NonInteractive: Story = {
  args: { dismissible: false, message: "Swiped right" },
};
export const Dark: Story = {
  args: { tone: "success", message: "Dark-mode notification" },
  globals: { theme: "dark" },
};
