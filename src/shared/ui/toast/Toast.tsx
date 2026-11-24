import cx from "classnames";
import * as React from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { useTimeoutFn } from "react-use";

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
  visualContent: React.ReactNode | undefined;
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
  const messageId = React.useId();

  return (
    <div
      className={cx(
        props.dismissible ? "pointer-events-auto" : "pointer-events-none",
        "flex min-h-touch max-w-reading items-center justify-center gap-2 rounded-pill px-4 py-2 font-semibold shadow-elevated",
        presentation.className
      )}
    >
      <span className="sr-only">{t(presentation.labelKey)}: </span>
      {props.visualContent === undefined ? (
        <span id={messageId} className="line-clamp-3 min-w-0 break-words">
          {props.message}
        </span>
      ) : (
        <>
          <span id={messageId} className="sr-only">
            {props.message}
          </span>
          <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
            {props.visualContent}
          </span>
        </>
      )}
      {props.dismissible ? (
        <button
          type="button"
          aria-label={t("toast.dismissNotification")}
          aria-describedby={messageId}
          className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={props.onDismiss}
        >
          <AiOutlineClose aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
};

const ToastTimer = ({ id, durationMs }: { id: ToastState["id"]; durationMs: number }) => {
  useTimeoutFn(() => dismissToast(id), durationMs);
  return null;
};

const ToastItem = ({ toast, modalActive }: { toast: ToastState; modalActive: boolean }) => {
  const { t } = useTranslation();
  const attachToast = (visualTarget: HTMLDivElement | null) => {
    if (visualTarget === null) return;
    const unregister = registerToastVisualTarget(toast.id, visualTarget);
    return () => {
      unregister();
    };
  };
  return (
    <div ref={attachToast}>
      <Toast
        message={t(toast.messageKey, toast.messageParams ?? {})}
        visualContent={toast.visualContent}
        tone={toast.tone}
        dismissible={toast.dismissible && !modalActive}
        onDismiss={() => dismissToast(toast.id)}
      />
    </div>
  );
};

interface ToastViewportProps<T extends HTMLElement> {
  focusFallbackRef?: React.RefObject<T | null>;
}

/** Renders bounded application-wide results independently of the active route. */
export const ToastViewport = <T extends HTMLElement = HTMLElement>({
  focusFallbackRef,
}: ToastViewportProps<T> = {}) => {
  const { t } = useTranslation();
  const current = useStore(toastStore, (state) => state.current);
  const supplementary = useStore(toastStore, (state) => state.supplementary);
  const toasts = [current, supplementary].filter((toast) => toast !== undefined);
  const modalTargets = useStore(toastStore, (state) => state.modalFocusTargets);
  const modalActive = modalTargets.length > 0;
  // A native modal makes outside live regions inert and paints above ordinary z-index layers.
  const nativeModal = modalTargets.findLast(
    ({ element }) => element instanceof HTMLDialogElement && element.isConnected && element.open
  )?.element;

  React.useLayoutEffect(() => {
    const focusFallbackTarget = focusFallbackRef?.current;
    if (focusFallbackTarget === undefined || focusFallbackTarget === null) return;
    return registerToastFocusFallbackTarget(focusFallbackTarget);
  }, [focusFallbackRef]);

  const renderAnnouncement = (toast: ToastState) => (
    <span
      key={toast.id}
    >{`${t(tonePresentation[toast.tone].labelKey)}: ${t(toast.messageKey, toast.messageParams ?? {})}`}</span>
  );

  // A modal can move the viewport to a portal without restarting a toast's deadline.
  const timers = toasts.map((toast) =>
    toast.durationMs === null ? null : <ToastTimer key={toast.id} id={toast.id} durationMs={toast.durationMs} />
  );

  const viewport = (
    <>
      <div
        role="status"
        aria-label={t("toast.notifications")}
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {toasts.filter((toast) => toast.tone !== "error").map(renderAnnouncement)}
      </div>
      <div
        role={toasts.some((toast) => toast.tone === "error") ? "alert" : undefined}
        aria-live="assertive"
        aria-atomic="false"
        className="sr-only"
      >
        {toasts.filter((toast) => toast.tone === "error").map(renderAnnouncement)}
      </div>
      {toasts.length === 0 ? null : (
        <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[70] flex flex-col items-center gap-2 px-shell-gutter">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} modalActive={modalActive} />
          ))}
        </div>
      )}
    </>
  );
  return (
    <>
      {timers}
      {nativeModal === undefined ? viewport : createPortal(viewport, nativeModal)}
    </>
  );
};
