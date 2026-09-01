import * as React from "react";
import { useTranslation } from "react-i18next";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";

type StudyHelpDialogControl =
  | "cardSwipeUp"
  | "cardSwipeDown"
  | "cardSwipeLeft"
  | "cardSwipeRight"
  | "flip"
  | "autoPlay"
  | "swipeButtons"
  | "playbackControls"
  | "cardDetails"
  | "exit";

type StudyHelpDialogAction =
  | "DoNothing"
  | "GoBack"
  | "GoToPrevCard"
  | "GoToNextCard"
  | "GoToNextCardMastered"
  | "GoToNextCardNotMastered"
  | "GoToNextCardToggleMastered"
  | "flip"
  | "autoPlay"
  | "autoPlayUnavailable"
  | "swipeButtonsVisible"
  | "swipeButtonsHidden"
  | "playbackControlsVisible"
  | "playbackControlsHidden"
  | "playbackControlsUnavailable"
  | "cardDetails"
  | "exit";

interface StudyHelpDialogRow {
  control: StudyHelpDialogControl;
  action: StudyHelpDialogAction;
}

const controlKeys = {
  cardSwipeUp: "studySession.help.controls.cardSwipeUp",
  cardSwipeDown: "studySession.help.controls.cardSwipeDown",
  cardSwipeLeft: "studySession.help.controls.cardSwipeLeft",
  cardSwipeRight: "studySession.help.controls.cardSwipeRight",
  flip: "studySession.help.controls.flip",
  autoPlay: "studySession.help.controls.autoPlay",
  swipeButtons: "studySession.help.controls.swipeButtons",
  playbackControls: "studySession.help.controls.playbackControls",
  cardDetails: "studySession.help.controls.cardDetails",
  exit: "studySession.help.controls.exit",
} as const satisfies Record<StudyHelpDialogControl, string>;

const actionKeys = {
  DoNothing: "studySession.help.actions.DoNothing",
  GoBack: "studySession.help.actions.GoBack",
  GoToPrevCard: "studySession.help.actions.GoToPrevCard",
  GoToNextCard: "studySession.help.actions.GoToNextCard",
  GoToNextCardMastered: "studySession.help.actions.GoToNextCardMastered",
  GoToNextCardNotMastered: "studySession.help.actions.GoToNextCardNotMastered",
  GoToNextCardToggleMastered: "studySession.help.actions.GoToNextCardToggleMastered",
  flip: "studySession.help.actions.flip",
  autoPlay: "studySession.help.actions.autoPlay",
  autoPlayUnavailable: "studySession.help.actions.autoPlayUnavailable",
  swipeButtonsVisible: "studySession.help.actions.swipeButtonsVisible",
  swipeButtonsHidden: "studySession.help.actions.swipeButtonsHidden",
  playbackControlsVisible: "studySession.help.actions.playbackControlsVisible",
  playbackControlsHidden: "studySession.help.actions.playbackControlsHidden",
  playbackControlsUnavailable: "studySession.help.actions.playbackControlsUnavailable",
  cardDetails: "studySession.help.actions.cardDetails",
  exit: "studySession.help.actions.exit",
} as const satisfies Record<StudyHelpDialogAction, string>;

export interface StudyHelpDialogProps {
  rows: readonly StudyHelpDialogRow[];
  restoreTriggerFocus: () => void;
  onClose: () => void;
}

export const StudyHelpDialog: React.FC<StudyHelpDialogProps> = (props) => {
  const { t } = useTranslation();
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

  const handleKeyDownEvent = React.useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-canvas/75 px-shell-gutter py-6 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-full w-full max-w-reading overflow-y-auto rounded-surface border border-border bg-surface-elevated p-4 text-ink shadow-elevated sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-title font-bold">
              {t("studySession.help.title")}
            </h2>
            <p id={descriptionId} className="mt-2 text-body text-ink-muted">
              {t("studySession.help.description")}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control border border-border px-3 py-2 font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={props.onClose}
          >
            {t("studySession.help.close")}
          </button>
        </div>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {props.rows.map((row) => (
            <div key={row.control} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <dt className="font-bold text-ink">{t(controlKeys[row.control])}</dt>
              <dd className="text-body text-ink-muted">{t(actionKeys[row.action])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
