import cx from "classnames";
import * as React from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import {
  dismissToast,
  registerToastFocusFallbackTarget,
  registerToastModalTarget,
  registerToastVisualTarget,
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

const tonePresentation: Record<ToastTone, { className: string; labelKey: `toast.tone.${ToastTone}` }> = {
  neutral: { className: "bg-info text-ink-inverse", labelKey: "toast.tone.neutral" },
  success: { className: "bg-success text-ink-inverse", labelKey: "toast.tone.success" },
  warning: { className: "bg-warning text-ink-inverse", labelKey: "toast.tone.warning" },
  error: { className: "bg-danger text-ink-inverse", labelKey: "toast.tone.error" },
};

const Toast = (props: ToastProps) => {
  const { t } = useTranslation();
  const presentation = tonePresentation[props.tone];

  return (
    <div
      className={cx(
        "pointer-events-auto flex min-h-touch max-w-reading items-center justify-center gap-2 rounded-pill px-4 py-2 font-semibold shadow-elevated",
        presentation.className
      )}
    >
      <span className="sr-only">{t(presentation.labelKey)}: </span>
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
          aria-label={t("toast.dismissNotification")}
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

interface ToastViewportProps<T extends HTMLElement> {
  focusFallbackRef?: React.RefObject<T | null>;
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
export const ToastViewport = <T extends HTMLElement = HTMLElement>({
  focusFallbackRef,
}: ToastViewportProps<T> = {}) => {
  const { t } = useTranslation();
  const toast = useStore(toastStore, (state) => state.current);
  const modalTarget = useStore(toastStore, (state) => state.modalTargets.at(-1)?.element);
  const visualTargetRef = React.useRef<HTMLDivElement>(null);
  useAutoDismiss(toast);

  React.useLayoutEffect(() => {
    const focusFallbackTarget = focusFallbackRef?.current;
    if (focusFallbackTarget === undefined || focusFallbackTarget === null) return;
    return registerToastFocusFallbackTarget(focusFallbackTarget);
  }, [focusFallbackRef]);

  React.useLayoutEffect(() => {
    const visualTarget = visualTargetRef.current;
    if (toast === undefined || visualTarget === null) return;
    return registerToastVisualTarget(toast.id, visualTarget);
  }, [toast, modalTarget]);

  const renderAnnouncement = (activeToast: ToastState) => (
    <span key={activeToast.id}>{`${t(tonePresentation[activeToast.tone].labelKey)}: ${activeToast.message}`}</span>
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
      <div
        ref={visualTargetRef}
        className="pointer-events-none fixed inset-x-0 bottom-36 z-[70] flex justify-center px-shell-gutter"
      >
        {renderToast(toast)}
      </div>
    );

  return (
    <>
      {/* Announcers stay global and mounted while only the visual controls move into an active modal. */}
      <div
        role="status"
        aria-label={t("toast.notifications")}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
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
