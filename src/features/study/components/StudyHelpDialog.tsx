import type { SwipeState } from "@/entities/preferences";

import * as React from "react";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";
import { Button } from "@/shared/ui/button";
import { buildStudyHelpItems } from "../model/help";

interface StudyHelpDialogProps {
  controls: SwipeState;
  onClose: () => void;
}

const StudyHelpDialog = ({ controls, onClose }: StudyHelpDialogProps) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementSelector) ?? []);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (first == null || last == null) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/70 px-shell-gutter py-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Study help"
        className="w-full max-w-reading rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-title font-bold">Study help</h2>
        <dl className="mt-4 divide-y divide-border">
          {buildStudyHelpItems(controls).map((item) => (
            <div key={item.control} className="grid gap-1 py-2 sm:grid-cols-2 sm:gap-4">
              <dt className="font-semibold">{item.control}</dt>
              <dd className="text-ink-muted">{item.action}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-border px-4 py-2 font-bold hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface StudyActionsBarProps {
  controls: SwipeState;
  onExit: () => void;
}

export const StudyActionsBar = ({ controls, onExit }: StudyActionsBarProps) => {
  const [helpOpen, setHelpOpen] = React.useState(false);
  return (
    <>
      <div className="fixed right-3 top-3 z-50 flex gap-2">
        <Button variant="quiet" size="sm" onClick={() => setHelpOpen(true)}>
          Help
        </Button>
        <Button variant="quiet" size="sm" onClick={onExit}>
          Exit study
        </Button>
      </div>
      {helpOpen ? <StudyHelpDialog controls={controls} onClose={() => setHelpOpen(false)} /> : null}
    </>
  );
};
