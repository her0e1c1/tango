import * as React from "react";
import { useTranslation } from "react-i18next";

import { focusableElementSelector } from "../../lib/focusableElementSelector";
import { Button } from "../button";
import { useToastModalFocusTarget } from "../toast";

export interface DestructiveActionDialogProps {
  title: string;
  targetLabel: string;
  targetName: string;
  description: React.ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DestructiveActionDialog: React.FC<DestructiveActionDialogProps> = (props) => {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const targetNameRef = React.useRef<HTMLSpanElement>(null);
  const confirmingRef = React.useRef(false);
  const titleId = React.useId();
  const targetId = React.useId();
  const descriptionId = React.useId();
  useToastModalFocusTarget(dialogRef, targetNameRef);

  React.useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!props.pending) return;
    // Both actions become disabled while pending, so focus must move before the browser can drop it outside the modal.
    targetNameRef.current?.focus();
  }, [props.pending]);

  const handleDialogTabKey = (event: KeyboardEvent) => {
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementSelector) ?? []);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const [first] = focusable;
    const last = focusable.at(-1);
    if (first == null || last == null) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleCancel = () => {
    // A started deletion cannot be cancelled, even before its pending prop reaches this render.
    if (props.pending || confirmingRef.current) return;
    props.onCancel();
  };

  const handleKeyDownEvent = React.useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (event.key === "Tab") {
      handleDialogTabKey(event);
    }
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    dialog.addEventListener("keydown", handleKeyDownEvent);
    return () => dialog.removeEventListener("keydown", handleKeyDownEvent);
  }, []);

  const describedBy = `${targetId} ${descriptionId}`;

  const handleConfirm = () => {
    if (props.pending || confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      void Promise.resolve(props.onConfirm())
        .catch(() => {
          // Prevent unhandled floating promise rejections. Callers own failure reporting and retry state.
        })
        .finally(() => {
          confirmingRef.current = false;
        });
    } catch (error) {
      confirmingRef.current = false;
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/70 px-shell-gutter py-6">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={props.pending || undefined}
        className="w-full max-w-reading rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
      >
        <h2 id={titleId} className="text-title font-bold">
          {props.title}
        </h2>
        <div id={targetId} className="mt-4 rounded-control bg-surface-muted p-3">
          <span className="block text-caption font-bold uppercase tracking-wide text-ink-muted">
            {props.targetLabel}
          </span>
          <span
            ref={targetNameRef}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to reach a long scrolling target name.
            tabIndex={0}
            className="mt-1 block max-h-24 overflow-y-auto break-words font-semibold"
          >
            {props.targetName}
          </span>
        </div>
        <div id={descriptionId} className="mt-4 space-y-2 text-body text-ink-muted">
          {props.description}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={props.pending}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-border bg-transparent px-4 py-2 font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={handleCancel}
          >
            {t("destructiveDialog.cancel")}
          </button>
          <Button variant="destructive" loading={Boolean(props.pending)} onClick={handleConfirm}>
            {props.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
