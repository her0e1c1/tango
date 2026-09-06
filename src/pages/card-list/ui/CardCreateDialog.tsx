import { useBodyScrollLock } from "@/shared/lib/useBodyScrollLock";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { CardFields, type CardFormFields } from "@/features/card-form";
import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";
import { Button } from "@/shared/ui/button";
import { useToastModalFocusTarget } from "@/shared/ui/toast";

export interface CardCreateDialogProps {
  categories: readonly string[];
  deckName: string;
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

export const CardCreateDialog: React.FC<CardCreateDialogProps> = (props) => {
  const { t } = useTranslation();
  const { isSubmitting } = useFormState({ control: props.form.control });
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  useBodyScrollLock();
  useToastModalFocusTarget(dialogRef, titleRef);

  React.useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector("textarea")?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  React.useLayoutEffect(() => {
    if (isSubmitting) titleRef.current?.focus();
  }, [isSubmitting]);

  const handleKeyDown = React.useEffectEvent((event: KeyboardEvent) => {
    // Expanded editors and the tag picker own their own focus trap and Escape handling.
    if (event.target instanceof Element && event.target.closest('[role="dialog"]') !== dialogRef.current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (!isSubmitting) props.onCancel();
    } else if (event.key === "Tab") {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementSelector) ?? []);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.addEventListener("keydown", handleKeyDown);
    return () => dialog?.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/70 px-shell-gutter py-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isSubmitting || undefined}
        className="max-h-full w-full max-w-reading overflow-y-auto rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
      >
        <h2 ref={titleRef} id={titleId} tabIndex={-1} className="text-title font-bold outline-none">
          {t("cardForm.create.title")}
        </h2>
        <p id={descriptionId} className="mt-2 text-caption text-ink-muted">
          {t("cardForm.create.description", { deckName: props.deckName })}
        </p>
        {/* Nested fixed dialogs must not inherit sibling margins from space-y utilities. */}
        <form className="mt-5 flex flex-col gap-4" onSubmit={props.onSubmit}>
          <CardFields categories={props.categories} form={props.form} />
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button variant="quiet" type="button" disabled={isSubmitting} onClick={props.onCancel}>
              {t("cardForm.actions.cancel")}
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {t(isSubmitting ? "cardForm.actions.creating" : "cardForm.actions.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
