import cx from "classnames";
import * as React from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import {
  dismissToast,
  registerToastFocusFallbackTarget,
  registerToastVisualTarget,
  toastStore,
  type ToastState,
  type ToastTone,
} from "./model";

interface ToastProps {
  message: string;
  tone: ToastTone;
  dismissible: boolean;
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

interface ToastViewportProps<T extends HTMLElement> {
  focusFallbackRef?: React.RefObject<T | null>;
}

/** Renders the one application-wide Toast without coupling callers to the active route. */
export const ToastViewport = <T extends HTMLElement = HTMLElement>({
  focusFallbackRef,
}: ToastViewportProps<T> = {}) => {
  const { t } = useTranslation();
  const toast = useStore(toastStore, (state) => state.current);
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
  }, [toast]);

  const renderAnnouncement = (activeToast: ToastState) => (
    <span key={activeToast.id}>{`${t(tonePresentation[activeToast.tone].labelKey)}: ${activeToast.message}`}</span>
  );

  const renderToast = (activeToast: ToastState) => (
    <Toast
      key={activeToast.id}
      message={activeToast.message}
      tone={activeToast.tone}
      dismissible={activeToast.dismissible}
      onDismiss={() => dismissToast(activeToast.id)}
    />
  );

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
      {visualViewport}
    </>
  );
};
