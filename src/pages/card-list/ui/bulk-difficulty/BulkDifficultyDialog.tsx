import { BulkDifficultyPanel } from "./BulkDifficultyPanel";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";
import { Button } from "@/shared/ui/button";
import { useToastModalFocusTarget } from "@/shared/ui/toast";

export interface BulkDifficultyDialogProps {
  cardCount: number;
  difficulty: number | null;
  difficultyLowerBound: number;
  difficultyUpperBound: number;
  selectionDisabled?: boolean;
  onDifficultyChange: (difficulty: number) => void;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

/** Confirms a non-destructive bulk difficulty change and owns the modal accessibility behavior. */
export const BulkDifficultyDialog: React.FC<BulkDifficultyDialogProps> = (props) => {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const descriptionRef = React.useRef<HTMLParagraphElement>(null);
  const confirmingRef = React.useRef(false);
  const titleId = React.useId();
  const descriptionId = React.useId();
  useToastModalFocusTarget(dialogRef, descriptionRef);

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
    // Both actions become disabled while saving, so focus must move before the browser can drop it outside the dialog.
    descriptionRef.current?.focus();
  }, [props.pending]);

  const trapFocus = (event: KeyboardEvent) => {
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementSelector) ?? []);
    const [first] = focusable;
    const last = focusable.at(-1);
    if (first == null || last == null) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleCancel = () => {
    // Once confirmation starts, the snapshot must stay fixed until that attempt settles.
    if (props.pending || confirmingRef.current) return;
    props.onCancel();
  };

  const handleKeyDownEvent = React.useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    } else if (event.key === "Tab") {
      trapFocus(event);
    }
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    dialog.addEventListener("keydown", handleKeyDownEvent);
    return () => dialog.removeEventListener("keydown", handleKeyDownEvent);
  }, []);

  const handleConfirm = () => {
    if (props.pending || confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      void Promise.resolve(props.onConfirm())
        .catch(() => {
          // Callers own the retry state and user feedback; consuming the rejection prevents an unhandled promise.
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
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={props.pending || undefined}
        className="max-h-full w-full max-w-reading overflow-y-auto rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
      >
        <h2 id={titleId} className="text-title font-bold">
          {t("cardList.bulkDifficulty.dialog.title")}
        </h2>
        <p
          id={descriptionId}
          ref={descriptionRef}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: This remains the dialog's focus target while both actions are disabled.
          tabIndex={0}
          className="mt-4 rounded-control bg-surface-muted p-3 text-body text-ink-muted outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {props.difficulty == null
            ? t("cardList.bulkDifficulty.target", { count: props.cardCount })
            : t("cardList.bulkDifficulty.dialog.description", {
                count: props.cardCount,
                difficulty: props.difficulty,
              })}
        </p>
        <BulkDifficultyPanel
          difficultyLowerBound={props.difficultyLowerBound}
          difficultyUpperBound={props.difficultyUpperBound}
          selectedDifficulty={props.difficulty}
          disabled={props.pending || props.selectionDisabled}
          onDifficultyChange={props.onDifficultyChange}
        />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={props.pending}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-border bg-transparent px-4 py-2 font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCancel}
          >
            {t("cardList.bulkDifficulty.dialog.cancel")}
          </button>
          <Button
            variant="primary"
            disabled={props.difficulty == null || props.cardCount === 0}
            loading={Boolean(props.pending)}
            onClick={handleConfirm}
          >
            {t("cardList.bulkDifficulty.dialog.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
};
