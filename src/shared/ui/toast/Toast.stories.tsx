import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { AiOutlineArrowRight } from "react-icons/ai";

import type { ToastTone } from ".";
import { ToastViewport } from "./Toast";
import { dismissToast, showToast } from "./model";

interface ToastStoryProps {
  messageKey: string;
  messageParams?: Readonly<Record<string, string | number>>;
  tone: ToastTone;
  dismissible?: boolean;
  visualContent?: React.ReactNode;
}

const useStoryToast = (props: ToastStoryProps) => {
  React.useEffect(() => {
    const id = showToast({
      messageKey: props.messageKey,
      messageParams: props.messageParams,
      tone: props.tone,
      durationMs: null,
      dismissible: props.dismissible ?? true,
      visualContent: props.visualContent,
    });
    return () => dismissToast(id);
  }, [props.dismissible, props.messageKey, props.messageParams, props.tone, props.visualContent]);
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
    messageKey: "account.toast.signInSuccess",
    tone: "neutral",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning", messageKey: "deckFilter.saveError" } };
export const ErrorState: Story = {
  args: { tone: "error", messageKey: "toast.saveFailure" },
};
export const LongMessage: Story = {
  args: {
    tone: "error",
    messageKey: "deckImport.toast.failureWithReason",
    messageParams: {
      reason: "The connection was interrupted before all cards could be saved. Check your connection and try again.",
    },
  },
};
export const NonInteractive: Story = {
  args: { dismissible: false, messageKey: "studySession.feedback.swipedRight" },
};
export const DirectionIcon: Story = {
  args: {
    dismissible: false,
    messageKey: "studySession.feedback.swipedRight",
    visualContent: <AiOutlineArrowRight aria-hidden="true" className="text-3xl" />,
  },
};
export const Dark: Story = {
  args: { tone: "success" },
  globals: { theme: "dark" },
};

export const WithParameters: Story = {
  args: { tone: "success", messageKey: "deckImport.toast.imported", messageParams: { count: 3 } },
};
