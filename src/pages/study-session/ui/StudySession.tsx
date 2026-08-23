import cx from "classnames";
import type * as React from "react";
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
  // This row reserves space above card metadata; safe-area padding is needed only when Header does not provide it.
  <div
    role="toolbar"
    aria-label="Study actions"
    className={cx(
      "relative z-40 flex shrink-0 pb-2 pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]",
      showHeader ? "pt-2" : "pt-[calc(0.5rem+env(safe-area-inset-top))]"
    )}
  >
    <Button size="sm" variant="quiet" onClick={onExit}>
      Exit
    </Button>
  </div>
);

const SwipeFeedback: React.FC<{ swipeFeedback: SwipeDirection | undefined }> = ({ swipeFeedback }) => {
  if (swipeFeedback === undefined) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-control bg-surface px-4 py-2 text-body font-bold text-ink shadow-surface"
    >
      {SWIPE_FEEDBACK_LABEL[swipeFeedback]}
    </div>
  );
};

const BackTextOverlays: React.FC<{ swipeOverlay: SwipeButtonListProps | undefined }> = ({ swipeOverlay }) => (
  <>
    <Overlay
      position="left"
      ariaLabel="Swipe left"
      {...(swipeOverlay?.onClickLeft !== undefined ? { onClick: swipeOverlay.onClickLeft } : {})}
    />
    <Overlay
      position="right"
      ariaLabel="Swipe right"
      {...(swipeOverlay?.onClickRight !== undefined ? { onClick: swipeOverlay.onClickRight } : {})}
    />
    <Overlay
      position="top"
      ariaLabel="Swipe up"
      {...(swipeOverlay?.onClickUp !== undefined ? { onClick: swipeOverlay.onClickUp } : {})}
    />
    <Overlay
      position="bottom"
      ariaLabel="Swipe down"
      {...(swipeOverlay?.onClickDown !== undefined ? { onClick: swipeOverlay.onClickDown } : {})}
    />
  </>
);

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
        <div className="h-full flex pb-8">{backTextSlot}</div>
      </>
    );
  }
  if (frontTextSlot != null) {
    return (
      <div className="h-full flex flex-col relative">
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
  if (!(showSwipeButtonList || showController)) return null;
  return (
    <div className={cx("fixed w-full bottom-2", "pb-5", showBackText && "invisible")}>
      {showSwipeButtonList ? <SwipeButtonList {...swipeButtonList} /> : null}
      {showController ? <Controller {...controller} /> : null}
    </div>
  );
};

export const StudySession: React.FC<StudySessionProps> = (props) => {
  // Keep horizontal gestures above face-specific content, but reserve vertical drags on the Back for scrolling.
  const swipeHandlers = useSwipeable({
    ...(props.onSwipeLeft !== undefined ? { onSwipedLeft: props.onSwipeLeft } : {}),
    ...(!props.showBackText && props.onSwipeUp !== undefined ? { onSwipedUp: props.onSwipeUp } : {}),
    ...(props.onSwipeRight !== undefined ? { onSwipedRight: props.onSwipeRight } : {}),
    ...(!props.showBackText && props.onSwipeDown !== undefined ? { onSwipedDown: props.onSwipeDown } : {}),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {props.feedbackSlot}
      <ExitAction showHeader={props.showHeader} onExit={props.onExit} />
      <SwipeFeedback swipeFeedback={props.swipeFeedback} />
      <div className="relative min-h-0 flex-1" {...swipeHandlers}>
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
