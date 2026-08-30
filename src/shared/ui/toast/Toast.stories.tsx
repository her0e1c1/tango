import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import type { ToastTone } from ".";
import { ToastModalOutlet, ToastViewport } from "./Toast";
import { dismissToast, showToast } from "./model";

interface ToastStoryProps {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  dismissible?: boolean;
  onAction: () => void;
}

const useStoryToast = (props: ToastStoryProps) => {
  React.useEffect(() => {
    const id = showToast({
      message: props.message,
      tone: props.tone,
      durationMs: null,
      dismissible: props.dismissible ?? true,
      ...(props.actionLabel !== undefined ? { action: { label: props.actionLabel, onClick: props.onAction } } : {}),
    });
    return () => dismissToast(id);
  }, [props.actionLabel, props.dismissible, props.message, props.onAction, props.tone]);
};

const ToastStory = (props: ToastStoryProps) => {
  useStoryToast(props);
  return <ToastViewport />;
};

const ModalOutletStory = (props: ToastStoryProps) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  useStoryToast(props);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 px-shell-gutter py-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="toast-modal-story-title"
          className="w-full max-w-reading rounded-surface border border-border bg-surface-elevated p-6 text-ink shadow-elevated"
        >
          <h2 id="toast-modal-story-title" className="text-title font-bold">
            Modal Toast outlet
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="mt-6 inline-flex min-h-touch items-center rounded-control border border-border px-4 py-2 font-bold"
          >
            Safe focus fallback
          </button>
          <ToastModalOutlet focusFallbackRef={closeRef} />
        </div>
      </div>
      <ToastViewport />
    </>
  );
};

const meta = {
  title: "Shared/Feedback/Toast",
  component: ToastStory,
  tags: ["autodocs"],
  args: {
    message: "Changes saved",
    tone: "neutral",
    onAction: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning", message: "Connection is unstable" } };
export const ErrorState: Story = {
  args: { tone: "error", message: "Unable to save changes.", actionLabel: "Retry" },
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
export const ModalOutlet: Story = {
  args: { tone: "error", message: "Delete failed", actionLabel: "Retry" },
  render: (args) => <ModalOutletStory {...args} />,
};
export const Dark: Story = {
  args: { tone: "success", message: "Dark-mode notification" },
  globals: { theme: "dark" },
};
