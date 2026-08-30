import cx from "classnames";
import * as React from "react";
import {
  AiOutlineClose,
  AiOutlineEllipsis,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineLeft,
  AiOutlinePlayCircle,
} from "react-icons/ai";
import { MdSwipe } from "react-icons/md";
import { useSwipeable } from "react-swipeable";
import type { SwipeDirection } from "@/entities/preference";

import { Controller, type ControllerProps } from "./Controller";
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
  "aria-label": "Card answer",
  "data-study-answer-scroll": "",
  tabIndex: 0,
} as const;

export interface StudySessionProps {
  showBackText?: boolean;
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  swipeFeedback?: SwipeDirection;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
  feedbackSlot?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onBack: () => void;
  onToggleCardDetails: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const toolbarButtonClass =
  "pointer-events-auto inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

interface StudyModeActionsProps {
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  playbackDescriptionId: string;
  onEscape: React.KeyboardEventHandler<HTMLButtonElement>;
  onToggleCardDetails: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const StudyModeActions: React.FC<StudyModeActionsProps> = (props) => {
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

const StudyToolbar: React.FC<{
  open: boolean;
  showCardDetails: boolean;
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  onToggleOpen: () => void;
  onToggleCardDetails: () => void;
  onBack: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}> = (props) => {
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
      {props.open ? (
        // The overlay stays out of document flow so opening it cannot move the centered prompt.
        <fieldset
          id={actionsId}
          aria-label="Study actions"
          className="pointer-events-none m-0 flex h-touch min-w-0 items-center justify-between border-0 p-0 pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right)+var(--spacing-touch)+0.25rem)]"
        >
          <button
            type="button"
            aria-label="Back to deck list"
            className={toolbarButtonClass}
            onClick={props.onBack}
            onKeyDown={closeOnEscape}
          >
            <AiOutlineLeft aria-hidden="true" className="text-xl" />
          </button>
          <StudyModeActions
            showCardDetails={props.showCardDetails}
            showSwipeControls={props.showSwipeControls}
            showPlaybackControls={props.showPlaybackControls}
            playbackControlsAvailable={props.playbackControlsAvailable}
            playbackDescriptionId={playbackDescriptionId}
            onEscape={closeOnEscape}
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

const CardContent: React.FC<{
  showBackText: boolean | undefined;
  backTextSlot: React.ReactNode | undefined;
  frontTextSlot: React.ReactNode | undefined;
  cardOverlaySlot: React.ReactNode | undefined;
}> = ({ showBackText, backTextSlot, frontTextSlot, cardOverlaySlot }) => {
  if (showBackText && backTextSlot != null) {
    return <div className="flex min-h-full w-full">{backTextSlot}</div>;
  }
  if (frontTextSlot != null) {
    return (
      <div className="relative h-full min-h-0">
        {cardOverlaySlot != null ? (
          // Metadata stays below the toolbar without reserving space in the centered prompt surface.
          <div className="absolute inset-x-0 top-[var(--study-card-top)] h-touch">{cardOverlaySlot}</div>
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
          open={studyActionsOpen}
          showCardDetails={props.showCardDetails}
          showSwipeControls={props.showSwipeControls}
          showPlaybackControls={props.showPlaybackControls}
          playbackControlsAvailable={props.playbackControlsAvailable}
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
          backTextSlot={props.backTextSlot}
          frontTextSlot={props.frontTextSlot}
          cardOverlaySlot={props.showCardDetails ? props.cardOverlaySlot : undefined}
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
    </div>
  );
};
