import cx from "classnames";
import * as React from "react";
import { useSwipeable } from "react-swipeable";
import type { SwipeDirection } from "@/entities/preference";
import { Button } from "@/shared/ui/button";
import { Overlay } from "@/shared/ui/feedback";

import { Controller, type ControllerProps } from "./Controller";
import { SwipeButtonList, type SwipeButtonListProps } from "./SwipeButtonList";

const SWIPE_FEEDBACK_LABEL: Record<SwipeDirection, string> = {
  cardSwipeUp: "Swiped up",
  cardSwipeDown: "Swiped down",
  cardSwipeLeft: "Swiped left",
  cardSwipeRight: "Swiped right",
};

export interface StudySessionProps {
  showHeader?: boolean;
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  swipeFeedback?: SwipeDirection;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  swipeOverlay?: SwipeButtonListProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
  feedbackSlot?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onExit: () => void;
}

const ExitAction: React.FC<{ showHeader: boolean | undefined; onExit: () => void }> = ({ showHeader, onExit }) => (
  // The action stays in flow so card content starts below it; Header owns the top safe area when visible.
  <div
    role="toolbar"
    aria-label="Study actions"
    className={cx(
      "relative z-40 flex shrink-0 border-b border-border bg-surface-elevated pb-2 pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]",
      showHeader ? "pt-2" : "pt-[calc(0.5rem+env(safe-area-inset-top))]"
    )}
  >
    <Button size="sm" variant="quiet" onClick={onExit}>
      Exit
    </Button>
  </div>
);

const SwipeFeedback: React.FC<{
  showHeader: boolean | undefined;
  swipeFeedback: SwipeDirection | undefined;
}> = ({ showHeader, swipeFeedback }) => {
  if (swipeFeedback === undefined) return null;
  return (
    <div
      role="status"
      className={cx(
        "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-control border border-border bg-surface-elevated px-4 py-2 text-body font-bold text-ink shadow-elevated",
        showHeader
          ? "top-[calc(var(--spacing-touch)+1rem)]"
          : "top-[calc(var(--spacing-touch)+1rem+env(safe-area-inset-top))]"
      )}
    >
      {SWIPE_FEEDBACK_LABEL[swipeFeedback]}
    </div>
  );
};

const BackTextOverlays: React.FC<{ swipeOverlay: SwipeButtonListProps | undefined }> = ({ swipeOverlay }) => {
  // Gesture hit zones must remain visually neutral so the full-width answer stays readable beneath them.
  const overlayClassName = "bg-transparent shadow-none";
  return (
    <>
      {swipeOverlay?.onClickLeft !== undefined ? (
        <Overlay
          position="left"
          ariaLabel="Swipe left"
          className={overlayClassName}
          onClick={swipeOverlay.onClickLeft}
        />
      ) : null}
      {swipeOverlay?.onClickRight !== undefined ? (
        <Overlay
          position="right"
          ariaLabel="Swipe right"
          className={overlayClassName}
          onClick={swipeOverlay.onClickRight}
        />
      ) : null}
      {swipeOverlay?.onClickUp !== undefined ? (
        <Overlay position="top" ariaLabel="Swipe up" className={overlayClassName} onClick={swipeOverlay.onClickUp} />
      ) : null}
      {swipeOverlay?.onClickDown !== undefined ? (
        <Overlay
          position="bottom"
          ariaLabel="Swipe down"
          className={overlayClassName}
          onClick={swipeOverlay.onClickDown}
        />
      ) : null}
    </>
  );
};

const CardContent: React.FC<{
  showBackText: boolean | undefined;
  backTextSlot: React.ReactNode | undefined;
  frontTextSlot: React.ReactNode | undefined;
  cardOverlaySlot: React.ReactNode | undefined;
  swipeOverlay: SwipeButtonListProps | undefined;
}> = ({ showBackText, backTextSlot, frontTextSlot, cardOverlaySlot, swipeOverlay }) => {
  if (showBackText && backTextSlot != null) {
    return (
      <>
        <BackTextOverlays swipeOverlay={swipeOverlay} />
        <div className="flex min-h-full w-full">{backTextSlot}</div>
      </>
    );
  }
  if (frontTextSlot != null) {
    return (
      <div className="relative flex h-full min-h-0 flex-col pt-touch">
        {cardOverlaySlot}
        {frontTextSlot}
      </div>
    );
  }
  return null;
};

const Controls: React.FC<{
  showBackText: boolean | undefined;
  showSwipeButtonList: boolean | undefined;
  showController: boolean | undefined;
  swipeButtonList: SwipeButtonListProps | undefined;
  controller: ControllerProps | undefined;
}> = ({ showBackText, showSwipeButtonList, showController, swipeButtonList, controller }) => {
  if (showBackText || !(showSwipeButtonList || showController)) return null;
  return (
    <div className="relative z-40 shrink-0 space-y-2 border-t border-border bg-surface-elevated pb-[calc(0.5rem+env(safe-area-inset-bottom))] pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] pt-2">
      {showSwipeButtonList ? <SwipeButtonList {...swipeButtonList} /> : null}
      {showController ? <Controller {...controller} /> : null}
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

  const withTrailingClickSuppression = (action: () => void) => () => {
    // Browsers emit a click after a mouse drag; keep that click from also flipping the study card.
    suppressCardClick.current = true;
    if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    suppressCardClickTimer.current = setTimeout(() => {
      suppressCardClick.current = false;
      suppressCardClickTimer.current = undefined;
    }, 0);
    action();
  };

  // Desktop drags and touch gestures share these Page-owned handlers; the Back still reserves vertical drags for scrolling.
  const swipeHandlers = useSwipeable({
    ...(props.onSwipeLeft !== undefined ? { onSwipedLeft: withTrailingClickSuppression(props.onSwipeLeft) } : {}),
    ...(!props.showBackText && props.onSwipeUp !== undefined
      ? { onSwipedUp: withTrailingClickSuppression(props.onSwipeUp) }
      : {}),
    ...(props.onSwipeRight !== undefined ? { onSwipedRight: withTrailingClickSuppression(props.onSwipeRight) } : {}),
    ...(!props.showBackText && props.onSwipeDown !== undefined
      ? { onSwipedDown: withTrailingClickSuppression(props.onSwipeDown) }
      : {}),
    trackMouse: true,
  });

  const stopTrailingCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (!suppressCardClick.current) return;

    suppressCardClick.current = false;
    if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    suppressCardClickTimer.current = undefined;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-canvas text-ink">
      {props.feedbackSlot}
      <ExitAction showHeader={props.showHeader} onExit={props.onExit} />
      <SwipeFeedback showHeader={props.showHeader} swipeFeedback={props.swipeFeedback} />
      <div
        className={cx("relative min-h-0 flex-1", props.showBackText ? "overflow-y-auto" : "overflow-hidden")}
        {...swipeHandlers}
        onClickCapture={stopTrailingCardClick}
      >
        <CardContent
          showBackText={props.showBackText}
          backTextSlot={props.backTextSlot}
          frontTextSlot={props.frontTextSlot}
          cardOverlaySlot={props.cardOverlaySlot}
          swipeOverlay={props.swipeOverlay}
        />
      </div>
      <Controls
        showBackText={props.showBackText}
        showSwipeButtonList={props.showSwipeButtonList}
        showController={props.showController}
        swipeButtonList={props.swipeButtonList}
        controller={props.controller}
      />
    </div>
  );
};
