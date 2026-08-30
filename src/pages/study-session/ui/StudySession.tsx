import cx from "classnames";
import * as React from "react";
import { AiOutlineLeft, AiOutlinePlayCircle } from "react-icons/ai";
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
  "--study-toolbar-top": string;
  "--study-card-top": string;
  "--study-feedback-top": string;
};

const studyLayoutStyles: StudyLayoutStyles = {
  "--study-toolbar-top": "calc(0.75rem + env(safe-area-inset-top))",
  "--study-card-top": "calc(var(--study-toolbar-top) + var(--spacing-touch) + 0.75rem)",
  // Card metadata is fixed at h-10; feedback starts immediately after it so neither surface overlaps.
  "--study-feedback-top": "calc(var(--study-card-top) + 2.5rem)",
};

export interface StudySessionProps {
  showBackText?: boolean;
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
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}

const toolbarButtonClass =
  "pointer-events-auto inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const StudyToolbar: React.FC<{
  showSwipeControls: boolean;
  showPlaybackControls: boolean;
  playbackControlsAvailable: boolean;
  onBack: () => void;
  onToggleSwipeControls: () => void;
  onTogglePlaybackControls: () => void;
}> = (props) => {
  const playbackDescriptionId = React.useId();
  const swipeTitle = props.showSwipeControls ? "Hide swipe controls" : "Show swipe controls";
  const playbackTitle = props.playbackControlsAvailable
    ? props.showPlaybackControls
      ? "Hide playback controls"
      : "Show playback controls"
    : PLAYBACK_UNAVAILABLE_DESCRIPTION;

  return (
    <fieldset
      aria-label="Study actions"
      className="pointer-events-none absolute inset-x-0 top-[var(--study-toolbar-top)] z-50 m-0 flex min-w-0 items-center justify-between border-0 p-0 pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]"
    >
      <button
        type="button"
        aria-label="Back to deck list"
        className={cx(
          toolbarButtonClass,
          "border border-border bg-surface-elevated/90 shadow-elevated backdrop-blur-md"
        )}
        onClick={props.onBack}
      >
        <AiOutlineLeft aria-hidden="true" className="text-xl" />
      </button>
      <div className="pointer-events-auto flex items-center rounded-pill border border-border bg-surface-elevated/90 p-0.5 shadow-elevated backdrop-blur-md">
        <button
          type="button"
          aria-label="Swipe controls"
          aria-pressed={props.showSwipeControls}
          title={swipeTitle}
          className={cx(toolbarButtonClass, props.showSwipeControls && "bg-surface-muted text-accent-primary")}
          onClick={props.onToggleSwipeControls}
        >
          <MdSwipe aria-hidden="true" className="text-xl" />
        </button>
        <span aria-hidden="true" className="h-6 w-px bg-border" />
        <button
          type="button"
          aria-label="Playback controls"
          aria-pressed={props.showPlaybackControls}
          aria-disabled={!props.playbackControlsAvailable}
          aria-describedby={!props.playbackControlsAvailable ? playbackDescriptionId : undefined}
          title={playbackTitle}
          className={cx(
            toolbarButtonClass,
            props.showPlaybackControls && "bg-surface-muted text-accent-primary",
            !props.playbackControlsAvailable && "cursor-not-allowed opacity-50"
          )}
          onClick={props.playbackControlsAvailable ? props.onTogglePlaybackControls : undefined}
        >
          <AiOutlinePlayCircle aria-hidden="true" className="text-xl" />
        </button>
        {!props.playbackControlsAvailable ? (
          <span id={playbackDescriptionId} className="sr-only">
            {PLAYBACK_UNAVAILABLE_DESCRIPTION}
          </span>
        ) : null}
      </div>
    </fieldset>
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
        {frontTextSlot}
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
          showSwipeControls={props.showSwipeControls}
          showPlaybackControls={props.showPlaybackControls}
          playbackControlsAvailable={props.playbackControlsAvailable}
          onBack={props.onBack}
          onToggleSwipeControls={props.onToggleSwipeControls}
          onTogglePlaybackControls={props.onTogglePlaybackControls}
        />
      ) : null}
      {showStudyChrome ? <SwipeFeedback swipeFeedback={props.swipeFeedback} /> : null}
      <div
        // The marker lets Page shortcuts leave Space to this scrolling surface and its focusable descendants.
        data-study-answer-scroll={props.showBackText ? "" : undefined}
        // The answer surface must remain reachable when its content has no focusable elements.
        tabIndex={props.showBackText ? 0 : undefined}
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
          cardOverlaySlot={props.cardOverlaySlot}
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
