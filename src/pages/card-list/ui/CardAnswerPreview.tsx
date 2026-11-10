import * as React from "react";
import { useTranslation } from "react-i18next";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";
import { Button } from "@/shared/ui/button";
import { useToastModalFocusTarget } from "@/shared/ui/toast";

export interface CardAnswerPreviewProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  restoreTriggerFocus: () => void;
}

export const CardAnswerPreview: React.FC<CardAnswerPreviewProps> = ({
  title,
  children,
  onClose,
  restoreTriggerFocus,
}) => {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const titleId = React.useId();
  const restoreFocus = React.useEffectEvent(restoreTriggerFocus);
  useToastModalFocusTarget(dialogRef, titleRef);

  React.useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    titleRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // Wait for the list's DOM and refs to settle; Strict Mode also cleans up a still-mounted dialog.
      queueMicrotask(() => {
        if (!dialog.isConnected) restoreFocus();
      });
    };
  }, []);

  const handleTab = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || event.defaultPrevented) return;
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("*")).filter((element) => {
      if (
        element.getClientRects().length === 0 ||
        element.closest("[hidden], [inert]") ||
        element.getAttribute("tabindex") === "-1"
      )
        return false;
      if (element.matches(focusableElementSelector)) return true;
      // Browsers also tab to overflowing math without an explicit tabindex. Keep those native stops.
      const style = getComputedStyle(element);
      return (
        (element.scrollWidth > element.clientWidth && /^(auto|scroll)$/u.test(style.overflowX)) ||
        (element.scrollHeight > element.clientHeight && /^(auto|scroll)$/u.test(style.overflowY))
      );
    });
    const first = focusable[0];
    const last = focusable.at(-1);
    if (first === undefined || last === undefined) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto h-[calc(100dvh_-_2rem)] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-content flex-col overflow-hidden overscroll-contain rounded-surface border border-border bg-surface-elevated p-0 text-ink shadow-elevated backdrop:bg-canvas/70 open:flex"
      onKeyDown={handleTab}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-study-inline py-3">
        <h2
          ref={titleRef}
          id={titleId}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Long Card titles need keyboard scrolling as well as initial focus.
          tabIndex={0}
          className="max-h-32 min-w-0 overflow-auto overscroll-contain break-words text-title font-bold"
        >
          {title}
        </h2>
        <Button variant="quiet" className="shrink-0" onClick={onClose}>
          {t("cardList.closeCard")}
        </Button>
      </div>
      <section
        aria-label={t("cardList.answer")}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: The answer owns keyboard scrolling independently of Close.
        tabIndex={0}
        className="min-h-0 flex-1 select-text overflow-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]"
      >
        {children}
      </section>
    </dialog>
  );
};
