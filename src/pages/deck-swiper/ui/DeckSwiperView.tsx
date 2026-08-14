/**
 * @file Composes the Deck Swiper Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import type { SwipeDirection } from "@/entities/preferences";

import cx from "classnames";
import type * as React from "react";
import { Overlay } from "@/shared/ui/feedback";
import { Controller, type ControllerProps, SwipeButtonList, type SwipeButtonListProps } from "@/features/study";

const SWIPE_FEEDBACK_LABEL: Record<SwipeDirection, string> = {
  cardSwipeUp: "Swiped up",
  cardSwipeDown: "Swiped down",
  cardSwipeLeft: "Swiped left",
  cardSwipeRight: "Swiped right",
};

export interface DeckSwiperViewProps {
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
}

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
  if (!showSwipeButtonList && !showController) return null;
  return (
    <div className={cx("fixed w-full bottom-2", "pb-5", showBackText && "invisible")}>
      {showSwipeButtonList ? <SwipeButtonList {...swipeButtonList} /> : null}
      {showController ? <Controller {...controller} /> : null}
    </div>
  );
};

/**
 * Composes the Deck Swiper screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
export const DeckSwiperView: React.FC<DeckSwiperViewProps> = (props) => (
  <>
    {props.feedbackSlot}
    <SwipeFeedback swipeFeedback={props.swipeFeedback} />
    <CardContent
      showBackText={props.showBackText}
      backTextSlot={props.backTextSlot}
      frontTextSlot={props.frontTextSlot}
      cardOverlaySlot={props.cardOverlaySlot}
      swipeOverlay={props.swipeOverlay}
    />
    <Controls
      showBackText={props.showBackText}
      showSwipeButtonList={props.showSwipeButtonList}
      showController={props.showController}
      swipeButtonList={props.swipeButtonList}
      controller={props.controller}
    />
  </>
);
