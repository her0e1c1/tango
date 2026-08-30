import * as React from "react";

import { focusableElementSelector } from "../../lib/focusableElementSelector";
import { Button } from "../button";

interface NavigationGuardDialogProps {
  onDiscardChanges: () => void;
  onKeepEditing: () => void;
}

export const NavigationGuardDialog: React.FC<NavigationGuardDialogProps> = ({ onDiscardChanges, onKeepEditing }) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    keepEditingRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const handleTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onKeepEditing();
    } else if (event.key === "Tab") {
      handleTabKey(event);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/70 px-shell-gutter py-6">
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: The alertdialog owns Escape and focus-trap keyboard handling. */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-reading rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="text-title font-bold">
          Discard unsaved changes?
        </h2>
        <p id={descriptionId} className="mt-4 text-body text-ink-muted">
          Your changes will be lost if you leave this page.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={keepEditingRef}
            type="button"
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-border bg-transparent px-4 py-2 font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={onKeepEditing}
          >
            Keep editing
          </button>
          <Button variant="destructive" onClick={onDiscardChanges}>
            Discard changes
          </Button>
        </div>
      </div>
    </div>
  );
};
