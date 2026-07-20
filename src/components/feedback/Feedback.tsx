/**
 * @file Defines the reusable Feedback component in the shared feedback library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

export type FeedbackTone = "neutral" | "success" | "warning" | "error";

const tonePresentation: Record<FeedbackTone, { className: string; label: string }> = {
  neutral: { className: "bg-info", label: "Information" },
  success: { className: "bg-success", label: "Success" },
  warning: { className: "bg-warning", label: "Warning" },
  error: { className: "bg-danger", label: "Error" },
};

/**
 * Renders the Feedback user interface.
 * Shows child content as a fixed status message with neutral, positive, or negative styling, and
 * renders nothing for empty content.
 */
export const Feedback: React.FC<{ children: React.ReactNode; tone?: FeedbackTone }> = (props) => {
  if (props.children == null) return null;

  const presentation = tonePresentation[props.tone ?? "neutral"];
  return (
    <div className="fixed inset-x-0 bottom-36 z-20 flex justify-center px-shell-gutter">
      <div
        role="status"
        aria-live="polite"
        className={cx(
          "flex min-h-touch max-w-reading items-center justify-center gap-1 rounded-pill px-4 py-2 font-semibold text-ink-inverse shadow-elevated",
          presentation.className
        )}
      >
        <span className="sr-only">{presentation.label}: </span>
        {props.children}
      </div>
    </div>
  );
};
