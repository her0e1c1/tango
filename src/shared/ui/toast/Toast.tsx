import cx from "classnames";
import * as React from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useStore } from "zustand";

import { dismissToast, toastStore, type ToastAction, type ToastState, type ToastTone } from "./model";

interface ToastProps {
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  dismissible: boolean;
  onAction: () => void;
  onDismiss: () => void;
}

const tonePresentation: Record<ToastTone, { className: string; label: string }> = {
  neutral: { className: "bg-info text-ink-inverse", label: "Information" },
  success: { className: "bg-success text-ink-inverse", label: "Success" },
  warning: { className: "bg-warning text-ink-inverse", label: "Warning" },
  error: { className: "bg-danger text-ink-inverse", label: "Error" },
};

const Toast = (props: ToastProps) => {
  const presentation = tonePresentation[props.tone];
  const role = props.tone === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-atomic="true"
      aria-live={props.tone === "error" ? "assertive" : "polite"}
      className={cx(
        "pointer-events-auto flex min-h-touch max-w-reading items-center justify-center gap-2 rounded-pill px-4 py-2 font-semibold shadow-elevated",
        presentation.className
      )}
    >
      <span className="sr-only">{presentation.label}: </span>
      <span className="min-w-0 break-words">{props.message}</span>
      {props.action !== undefined ? (
        <button
          type="button"
          className="inline-flex min-h-touch shrink-0 items-center justify-center rounded-control border border-current px-3 py-1 text-caption font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={props.onAction}
        >
          {props.action.label}
        </button>
      ) : null}
      {props.dismissible ? (
        <button
          type="button"
          aria-label="Dismiss notification"
          className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={props.onDismiss}
        >
          <AiOutlineClose aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
};

const useAutoDismiss = (toast: ToastState | undefined) => {
  React.useEffect(() => {
    if (toast === undefined || toast.durationMs === null) return;
    const timeout = window.setTimeout(() => dismissToast(toast.id), toast.durationMs);
    return () => window.clearTimeout(timeout);
  }, [toast]);
};

/** Renders the one application-wide Toast without coupling callers to the active route. */
export const ToastViewport = () => {
  const toast = useStore(toastStore, (state) => state.current);
  useAutoDismiss(toast);

  if (toast === undefined) return null;

  const runAction = () => {
    const { action } = toast;
    dismissToast(toast.id);
    action?.onClick();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[70] flex justify-center px-shell-gutter">
      <Toast
        message={toast.message}
        tone={toast.tone}
        dismissible={toast.dismissible}
        onAction={runAction}
        onDismiss={() => dismissToast(toast.id)}
        {...(toast.action !== undefined ? { action: toast.action } : {})}
      />
    </div>
  );
};
