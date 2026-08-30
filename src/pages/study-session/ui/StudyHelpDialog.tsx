import * as React from "react";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";

interface StudyHelpDialogRow {
  control: string;
  action: string;
}

export interface StudyHelpDialogProps {
  title: string;
  description: string;
  closeLabel: string;
  rows: readonly StudyHelpDialogRow[];
  restoreTriggerFocus: () => void;
  onClose: () => void;
}

export const StudyHelpDialog: React.FC<StudyHelpDialogProps> = (props) => {
  const { restoreTriggerFocus } = props;
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreTriggerFocus();
    };
  }, [restoreTriggerFocus]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
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
      props.onClose();
    } else if (event.key === "Tab") {
      trapFocus(event);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-canvas/75 px-shell-gutter py-6 backdrop-blur-sm">
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: The modal owns Escape and focus-trap keyboard handling. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-full w-full max-w-reading overflow-y-auto rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-title font-bold">
              {props.title}
            </h2>
            <p id={descriptionId} className="mt-2 text-body text-ink-muted">
              {props.description}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control border border-border px-3 py-2 font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={props.onClose}
          >
            {props.closeLabel}
          </button>
        </div>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {props.rows.map((row) => (
            <div key={row.control} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <dt className="font-bold text-ink">{row.control}</dt>
              <dd className="text-body text-ink-muted">{row.action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
