import cx from "classnames";
import * as React from "react";
import {
  AiOutlineClose,
  AiOutlineEllipsis,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineLeft,
  AiOutlinePlayCircle,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { MdSwipe } from "react-icons/md";
import { useSwipeable } from "react-swipeable";
import type { SwipeDirection } from "@/entities/preference";
import { Overlay } from "@/shared/ui/feedback";

import { Controller, type ControllerProps } from "./Controller";
import { StudyHelpDialog, type StudyHelpDialogProps } from "./StudyHelpDialog";
import { SwipeButtonList, type SwipeButtonListProps } from "./SwipeButtonList";

const SWIPE_FEEDBACK_LABEL: Record<SwipeDirection, string> = {
  cardSwipeUp: "Swiped up",
  cardSwipeDown: "Swiped down",
  cardSwipeLeft: "Swiped left",
  cardSwipeRight: "Swiped right",
};

const PLAYBACK_UNAVAILABLE_DESCRIPTION = "Playback controls unavailable because the card interval is set to 0";

type StudyLayoutStyles = React.CSSProperties & {
  "--study-safe-area-top": string;
  "--study-safe-area-bottom": string;
  "--study-toolbar-top": string;
  "--study-card-top": string;
  "--study-feedback-top": string;
};

const studyLayoutStyles: StudyLayoutStyles = {
  "--study-safe-area-top": "env(safe-area-inset-top)",
  "--study-safe-area-bottom": "env(safe-area-inset-bottom)",
  "--study-toolbar-top": "calc(0.75rem + var(--study-safe-area-top))",
  "--study-card-top": "calc(var(--study-toolbar-top) + var(--spacing-touch) + 0.75rem)",
  // Card metadata is fixed at h-10; feedback starts immediately after it so neither surface overlaps.
  "--study-feedback-top": "calc(var(--study-card-top) + 2.5rem)",
};

// The marker reserves Space for answer scrolling, while the named region makes the focus target discoverable.
const answerSurfaceProps = {
  role: "region",
  "aria-label": "Study answer",
  "data-study-answer-scroll": "",
  tabIndex: 0,
} as const;

export interface StudySessionProps {
  showBackText?: boolean;
  showHelp: boolean;
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  swipeFeedback?: SwipeDirection;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  backTextOverlay?: {
    onClickLeft?: () => void;
    onClickRight?: () => void;
  };
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
  feedbackSlot?: React.ReactNode;
  help: Omit<StudyHelpDialogProps, "onClose" | "restoreTriggerFocus"> & {
    open: boolean;
    triggerLabel: string;
    onOpen: () => void;
    onClose: () => void;
  };
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onBack: () => void;
  onToggleCardDetails: () => void;
  onToggleHelp: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const toolbarButtonClass =
  "pointer-events-auto inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

interface StudyModeActionsProps {
  showHelp: boolean;
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  playbackDescriptionId: string;
  onEscape: React.KeyboardEventHandler<HTMLButtonElement>;
  onToggleHelp: () => void;
  onToggleCardDetails: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const StudyModeActions: React.FC<StudyModeActionsProps> = (props) => {
  const helpTitle = props.showHelp ? "Hide help button" : "Show help button";
  const swipeTitle = props.showSwipeControls ? "Hide swipe controls" : "Show swipe controls";
  const playbackTitle = props.playbackControlsAvailable
    ? props.showPlaybackControls
      ? "Hide playback controls"
      : "Show playback controls"
    : PLAYBACK_UNAVAILABLE_DESCRIPTION;
  const cardDetailsTitle = props.showCardDetails ? "Hide card details" : "Show card details";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Help button"
        aria-pressed={props.showHelp}
        title={helpTitle}
        className={cx(toolbarButtonClass, props.showHelp && "bg-surface-muted text-accent-primary")}
        onClick={props.onToggleHelp}
        onKeyDown={props.onEscape}
      >
        <AiOutlineQuestionCircle aria-hidden="true" className="text-xl" />
      </button>
      <button
        type="button"
        aria-label="Swipe controls"
        aria-pressed={props.showSwipeControls}
        title={swipeTitle}
        className={cx(toolbarButtonClass, props.showSwipeControls && "bg-surface-muted text-accent-primary")}
        onClick={props.onToggleSwipeControls}
        onKeyDown={props.onEscape}
      >
        <MdSwipe aria-hidden="true" className="text-xl" />
      </button>
      <button
        type="button"
        aria-label="Playback controls"
        aria-pressed={props.showPlaybackControls}
        aria-disabled={!props.playbackControlsAvailable}
        aria-describedby={!props.playbackControlsAvailable ? props.playbackDescriptionId : undefined}
        title={playbackTitle}
        className={cx(
          toolbarButtonClass,
          props.showPlaybackControls && "bg-surface-muted text-accent-primary",
          !props.playbackControlsAvailable && "cursor-not-allowed opacity-50"
        )}
        onClick={props.playbackControlsAvailable ? props.onTogglePlaybackControls : undefined}
        onKeyDown={props.onEscape}
      >
        <AiOutlinePlayCircle aria-hidden="true" className="text-xl" />
      </button>
      <button
        type="button"
        aria-label="Card details"
        aria-pressed={props.showCardDetails}
        title={cardDetailsTitle}
        className={cx(toolbarButtonClass, props.showCardDetails && "bg-surface-muted text-accent-primary")}
        onClick={props.onToggleCardDetails}
        onKeyDown={props.onEscape}
      >
        {props.showCardDetails ? (
          <AiOutlineEye aria-hidden="true" className="text-xl" />
        ) : (
          <AiOutlineEyeInvisible aria-hidden="true" className="text-xl" />
        )}
      </button>
    </div>
  );
};

interface StudyToolbarProps {
  ref?: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  showHelp: boolean;
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  helpTriggerLabel: string;
  onOpenHelp: () => void;
  onToggleHelp: () => void;
  onToggleOpen: () => void;
  onToggleCardDetails: () => void;
  onBack: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const StudyToolbar: React.FC<StudyToolbarProps> = ({ ref: helpTriggerRef, ...props }) => {
  const actionsId = React.useId();
  const playbackDescriptionId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const closeOnEscape: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== "Escape" || !props.open) return;
    event.preventDefault();
    props.onToggleOpen();
    triggerRef.current?.focus();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[var(--study-toolbar-top)] z-50 h-touch">
      <button
        type="button"
        aria-label="Back to deck list"
        className={cx(
          toolbarButtonClass,
          "absolute left-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] top-0"
        )}
        onClick={props.onBack}
        onKeyDown={closeOnEscape}
      >
        <AiOutlineLeft aria-hidden="true" className="text-xl" />
      </button>
      <button
        ref={triggerRef}
        type="button"
        aria-label={props.open ? "Close study actions" : "Open study actions"}
        aria-expanded={props.open}
        aria-controls={actionsId}
        className={cx(
          toolbarButtonClass,
          "absolute right-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] top-0"
        )}
        onClick={props.onToggleOpen}
        onKeyDown={closeOnEscape}
      >
        {props.open ? (
          <AiOutlineClose aria-hidden="true" className="text-xl" />
        ) : (
          <AiOutlineEllipsis aria-hidden="true" className="text-xl" />
        )}
      </button>
      {props.showHelp ? (
        <button
          ref={helpTriggerRef}
          type="button"
          aria-label={props.helpTriggerLabel}
          className={cx(
            toolbarButtonClass,
            "absolute right-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right)+var(--spacing-touch)+0.25rem)] top-0"
          )}
          onClick={props.onOpenHelp}
          onKeyDown={closeOnEscape}
        >
          <AiOutlineQuestionCircle aria-hidden="true" className="text-xl" />
        </button>
      ) : null}
      {props.open ? (
        // Four actions cannot share a 320px row with Back and the two right-side triggers. Below 360px,
        // keep them on a second row and hide metadata there so both interactive surfaces remain unobstructed.
        <fieldset
          id={actionsId}
          aria-label="Study actions"
          className={cx(
            "pointer-events-none m-0 flex h-touch min-w-0 items-center justify-end border-0 p-0 max-[359px]:absolute max-[359px]:inset-x-0 max-[359px]:top-[calc(var(--spacing-touch)+0.25rem)] max-[359px]:pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]",
            props.showHelp
              ? "pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right)+var(--spacing-touch)*2+0.5rem)]"
              : "pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right)+var(--spacing-touch)+0.25rem)]"
          )}
        >
          <StudyModeActions
            showHelp={props.showHelp}
            showCardDetails={props.showCardDetails}
            showSwipeControls={props.showSwipeControls}
            showPlaybackControls={props.showPlaybackControls}
            playbackControlsAvailable={props.playbackControlsAvailable}
            playbackDescriptionId={playbackDescriptionId}
            onEscape={closeOnEscape}
            onToggleHelp={props.onToggleHelp}
            onToggleCardDetails={props.onToggleCardDetails}
            onToggleSwipeControls={props.onToggleSwipeControls}
            onTogglePlaybackControls={props.onTogglePlaybackControls}
          />
        </fieldset>
      ) : null}
      {!props.playbackControlsAvailable ? (
        <span id={playbackDescriptionId} className="sr-only">
          {PLAYBACK_UNAVAILABLE_DESCRIPTION}
        </span>
      ) : null}
    </div>
  );
};

const SwipeFeedback: React.FC<{ swipeFeedback: SwipeDirection | undefined }> = ({ swipeFeedback }) => {
  if (swipeFeedback === undefined) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute left-1/2 top-[var(--study-feedback-top)] z-50 -translate-x-1/2 rounded-pill border border-border bg-surface-elevated/90 px-4 py-2 text-body font-bold text-ink shadow-elevated backdrop-blur-md"
    >
      {SWIPE_FEEDBACK_LABEL[swipeFeedback]}
    </div>
  );
};

const scrollAnswerFromOverlay = (event: WheelEvent) => {
  const answerSurface = (event.currentTarget as HTMLElement).closest<HTMLDivElement>("[data-study-answer-scroll]");
  if (answerSurface === null || event.deltaY === 0) return;

  // React delegates wheel events passively, so this native listener must remain cancelable to avoid a second native scroll.
  const multiplier =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? answerSurface.clientHeight
        : 1;
  answerSurface.scrollTop += event.deltaY * multiplier;
  event.preventDefault();
  event.stopPropagation();
};

const BackTextEdgeOverlay: React.FC<{
  ariaLabel: string;
  className: string;
  onClick: () => void;
}> = ({ ariaLabel, className, onClick }) => {
  const wheelTargetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const wheelTarget = wheelTargetRef.current;
    if (wheelTarget === null) return;

    wheelTarget.addEventListener("wheel", scrollAnswerFromOverlay, { passive: false });
    return () => wheelTarget.removeEventListener("wheel", scrollAnswerFromOverlay);
  }, []);

  return (
    <div ref={wheelTargetRef} className={cx("pointer-events-auto absolute inset-y-0 touch-pan-y", className)}>
      <Overlay
        className="pointer-events-auto inset-0 size-full touch-pan-y"
        position="center"
        variant="transparent"
        ariaLabel={ariaLabel}
        onClick={onClick}
      />
    </div>
  );
};

const BackTextOverlays: React.FC<{
  overlay: StudySessionProps["backTextOverlay"];
}> = ({ overlay }) => {
  if (overlay?.onClickLeft === undefined && overlay?.onClickRight === undefined) return null;

  return (
    // The fixed wrapper stays nested under the answer so scroll drags still suppress their trailing click.
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Edge taps stay explicit actions, while vertical touch pans remain native answer scrolling gestures. */}
      {overlay.onClickLeft !== undefined ? (
        <BackTextEdgeOverlay className="left-0 w-20" ariaLabel="Swipe left" onClick={overlay.onClickLeft} />
      ) : null}
      {overlay.onClickRight !== undefined ? (
        <BackTextEdgeOverlay
          // Leave a pointer-free scrollbar gutter while the hit area floats over the answer.
          className="right-5 w-[calc(5rem-1.25rem)]"
          ariaLabel="Swipe right"
          onClick={overlay.onClickRight}
        />
      ) : null}
    </div>
  );
};

const CardContent: React.FC<{
  showBackText: boolean | undefined;
  hideCardOverlayOnNarrowScreen: boolean;
  backTextSlot: React.ReactNode | undefined;
  frontTextSlot: React.ReactNode | undefined;
  cardOverlaySlot: React.ReactNode | undefined;
  backTextOverlay: StudySessionProps["backTextOverlay"];
}> = ({
  showBackText,
  hideCardOverlayOnNarrowScreen,
  backTextSlot,
  frontTextSlot,
  cardOverlaySlot,
  backTextOverlay,
}) => {
  if (showBackText && backTextSlot != null) {
    return (
      <>
        <BackTextOverlays overlay={backTextOverlay} />
        {/* Edge actions float above the full-width answer so enabling them never changes the Card layout. */}
        <div data-study-answer-content="" className="flex min-h-full w-full">
          {backTextSlot}
        </div>
      </>
    );
  }
  if (frontTextSlot != null) {
    return (
      <div className="relative h-full min-h-0">
        {cardOverlaySlot != null ? (
          // Metadata stays below the toolbar without reserving space in the centered prompt surface.
          <div
            data-study-card-overlay=""
            className={cx(
              "absolute inset-x-0 top-[var(--study-card-top)] h-touch",
              hideCardOverlayOnNarrowScreen && "max-[359px]:hidden"
            )}
          >
            {cardOverlaySlot}
          </div>
        ) : null}
        {/* Reversed vertical insets optically center the prompt when iPhone safe areas are asymmetric. */}
        <div className="h-full min-h-0 pb-[var(--study-safe-area-top)] pt-[var(--study-safe-area-bottom)]">
          {frontTextSlot}
        </div>
      </div>
    );
  }
  return null;
};

const Controls: React.FC<{
  showBackText: boolean | undefined;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  swipeButtonList: SwipeButtonListProps | undefined;
  controller: ControllerProps | undefined;
}> = ({
  showBackText,
  showSwipeControls,
  showPlaybackControls,
  playbackControlsAvailable,
  swipeButtonList,
  controller,
}) => {
  const showController = showPlaybackControls && playbackControlsAvailable;
  if (showBackText || !(showSwipeControls || showController)) return null;
  return (
    // The dock floats so toggling either control group cannot move the prompt away from screen center.
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] pt-2">
      <div className="pointer-events-auto mx-auto w-full max-w-content space-y-2 rounded-surface border border-border bg-surface-elevated/90 p-2 shadow-elevated backdrop-blur-md">
        {showSwipeControls ? <SwipeButtonList {...swipeButtonList} /> : null}
        {showController ? <Controller {...controller} /> : null}
      </div>
    </div>
  );
};

export const StudySession: React.FC<StudySessionProps> = (props) => {
  const [studyActionsOpen, setStudyActionsOpen] = React.useState(false);
  // Safari does not focus pointer-activated buttons by default, so Help must restore this explicit trigger.
  const helpTriggerRef = React.useRef<HTMLButtonElement>(null);
  const restoreHelpTriggerFocus = () => {
    if (helpTriggerRef.current?.isConnected) helpTriggerRef.current.focus();
  };
  const suppressCardClick = React.useRef(false);
  const suppressCardClickTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(
    () => () => {
      if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    },
    []
  );

  const suppressTrailingCardClick = () => {
    // Browsers emit a click after a mouse drag; keep that click from also flipping the study card.
    suppressCardClick.current = true;
    if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    suppressCardClickTimer.current = setTimeout(() => {
      suppressCardClick.current = false;
      suppressCardClickTimer.current = undefined;
    }, 0);
  };

  const swipeHandlers = useSwipeable({
    onSwiped: suppressTrailingCardClick,
    ...(!props.showBackText && props.onSwipeLeft !== undefined ? { onSwipedLeft: props.onSwipeLeft } : {}),
    ...(!props.showBackText && props.onSwipeUp !== undefined ? { onSwipedUp: props.onSwipeUp } : {}),
    ...(!props.showBackText && props.onSwipeRight !== undefined ? { onSwipedRight: props.onSwipeRight } : {}),
    ...(!props.showBackText && props.onSwipeDown !== undefined ? { onSwipedDown: props.onSwipeDown } : {}),
    trackMouse: true,
  });

  const startPrimaryMouseSwipe: React.MouseEventHandler<HTMLDivElement> = (event) => {
    // react-swipeable tracks every mouse button by default, but only the primary button may change study progress.
    if (event.button === 0) swipeHandlers.onMouseDown?.(event);
  };

  const stopTrailingCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (!suppressCardClick.current) return;

    suppressCardClick.current = false;
    if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    suppressCardClickTimer.current = undefined;
    event.preventDefault();
    event.stopPropagation();
  };

  const cardGestureHandlers = {
    ...swipeHandlers,
    onClickCapture: stopTrailingCardClick,
    onMouseDown: startPrimaryMouseSwipe,
  };

  // The answer owns the reading surface, so session chrome stays unmounted until the front returns.
  const showStudyChrome = !props.showBackText;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-canvas text-ink" style={studyLayoutStyles}>
      {showStudyChrome ? props.feedbackSlot : null}
      {showStudyChrome ? (
        <StudyToolbar
          ref={helpTriggerRef}
          open={studyActionsOpen}
          showHelp={props.showHelp}
          showCardDetails={props.showCardDetails}
          showSwipeControls={props.showSwipeControls}
          showPlaybackControls={props.showPlaybackControls}
          playbackControlsAvailable={props.playbackControlsAvailable}
          helpTriggerLabel={props.help.triggerLabel}
          onOpenHelp={props.help.onOpen}
          onToggleHelp={props.onToggleHelp}
          onToggleOpen={() => setStudyActionsOpen((open) => !open)}
          onToggleCardDetails={props.onToggleCardDetails}
          onBack={props.onBack}
          onToggleSwipeControls={props.onToggleSwipeControls}
          onTogglePlaybackControls={props.onTogglePlaybackControls}
        />
      ) : null}
      {showStudyChrome ? <SwipeFeedback swipeFeedback={props.swipeFeedback} /> : null}
      <div
        {...(props.showBackText ? answerSurfaceProps : {})}
        className={cx(
          "relative min-h-0 flex-1",
          props.showBackText ? "overflow-y-auto pt-[env(safe-area-inset-top)]" : "overflow-hidden"
        )}
        {...cardGestureHandlers}
      >
        <CardContent
          showBackText={props.showBackText}
          hideCardOverlayOnNarrowScreen={studyActionsOpen}
          backTextSlot={props.backTextSlot}
          frontTextSlot={props.frontTextSlot}
          cardOverlaySlot={props.showCardDetails ? props.cardOverlaySlot : undefined}
          backTextOverlay={props.backTextOverlay}
        />
      </div>
      <Controls
        showBackText={props.showBackText}
        showSwipeControls={props.showSwipeControls}
        showPlaybackControls={props.showPlaybackControls}
        playbackControlsAvailable={props.playbackControlsAvailable}
        swipeButtonList={props.swipeButtonList}
        controller={props.controller}
      />
      {props.help.open ? (
        <StudyHelpDialog
          title={props.help.title}
          description={props.help.description}
          closeLabel={props.help.closeLabel}
          rows={props.help.rows}
          restoreTriggerFocus={restoreHelpTriggerFocus}
          onClose={props.help.onClose}
        />
      ) : null}
    </div>
  );
};
