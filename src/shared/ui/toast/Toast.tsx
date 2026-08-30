import cx from "classnames";
import * as React from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { useStore } from "zustand";

import {
  dismissToast,
  registerToastModalTarget,
  toastStore,
  type ToastAction,
  type ToastState,
  type ToastTone,
} from "./model";

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

  return (
    <div
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

interface ToastModalOutletProps<T extends HTMLElement> {
  focusFallbackRef: React.RefObject<T | null>;
}

/** Hosts the application Toast inside an active modal's DOM and focus boundary. */
export const ToastModalOutlet = <T extends HTMLElement>({ focusFallbackRef }: ToastModalOutletProps<T>) => {
  const outletRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const outlet = outletRef.current;
    if (outlet === null) return;
    // Register before paint so controls never remain above and outside the newly mounted modal.
    return registerToastModalTarget(outlet, () => focusFallbackRef.current?.focus());
  }, [focusFallbackRef]);

  return <div ref={outletRef} />;
};

/** Renders the one application-wide Toast without coupling callers to the active route. */
export const ToastViewport = () => {
  const toast = useStore(toastStore, (state) => state.current);
  const modalTarget = useStore(toastStore, (state) => state.modalTargets.at(-1)?.element);
  useAutoDismiss(toast);

  const renderAnnouncement = (activeToast: ToastState) => (
    <span key={activeToast.id}>{`${tonePresentation[activeToast.tone].label}: ${activeToast.message}`}</span>
  );

  const renderToast = (activeToast: ToastState) => {
    const runAction = () => {
      const { action } = activeToast;
      dismissToast(activeToast.id);
      action?.onClick();
    };

    return (
      <Toast
        key={activeToast.id}
        message={activeToast.message}
        tone={activeToast.tone}
        dismissible={activeToast.dismissible}
        onAction={runAction}
        onDismiss={() => dismissToast(activeToast.id)}
        {...(activeToast.action !== undefined ? { action: activeToast.action } : {})}
      />
    );
  };

  const visualViewport =
    toast === undefined ? null : (
      <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[70] flex justify-center px-shell-gutter">
        {renderToast(toast)}
      </div>
    );

  return (
    <>
      {/* Announcers stay global and mounted while only the visual controls move into an active modal. */}
      <div role="status" aria-label="Toast notifications" aria-live="polite" aria-atomic="true" className="sr-only">
        {toast !== undefined && toast.tone !== "error" ? renderAnnouncement(toast) : null}
      </div>
      <div
        role={toast?.tone === "error" ? "alert" : undefined}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {toast?.tone === "error" ? renderAnnouncement(toast) : null}
      </div>
      {visualViewport === null || modalTarget === undefined
        ? visualViewport
        : createPortal(visualViewport, modalTarget)}
    </>
  );
};
