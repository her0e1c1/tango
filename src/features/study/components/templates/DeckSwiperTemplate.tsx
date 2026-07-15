import cx from "classnames";
import type * as React from "react";
import * as Shared from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";
import { Controller, type ControllerProps } from "@/features/study/components/Controller";
import { SwipeButtonList, type SwipeButtonListProps } from "@/features/study/components/SwipeButtonList";

export interface DeckSwiperTemplateProps {
  showHeader?: boolean;
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  layout?: LayoutProps;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  swipeOverlay?: SwipeButtonListProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
}

export const DeckSwiperTemplate: React.FC<DeckSwiperTemplateProps> = (props) => {
  return (
    <Layout
      fullscreen
      {...(props.showHeader !== undefined ? { showHeader: props.showHeader && !props.showBackText } : {})}
      {...(props.showBackText !== undefined ? { scroll: props.showBackText } : {})}
      {...props.layout}
    >
      {props.showBackText && props.backTextSlot != null ? (
        <>
          <Shared.Overlay
            position="left"
            ariaLabel="Swipe left"
            {...(props.swipeOverlay?.onClickLeft !== undefined ? { onClick: props.swipeOverlay.onClickLeft } : {})}
          />
          <Shared.Overlay
            position="right"
            ariaLabel="Swipe right"
            {...(props.swipeOverlay?.onClickRight !== undefined ? { onClick: props.swipeOverlay.onClickRight } : {})}
          />
          <Shared.Overlay
            position="top"
            ariaLabel="Swipe up"
            {...(props.swipeOverlay?.onClickUp !== undefined ? { onClick: props.swipeOverlay.onClickUp } : {})}
          />
          <Shared.Overlay
            position="bottom"
            ariaLabel="Swipe down"
            {...(props.swipeOverlay?.onClickDown !== undefined ? { onClick: props.swipeOverlay.onClickDown } : {})}
          />
          <div className="h-full flex pb-8">{props.backTextSlot}</div>
        </>
      ) : props.frontTextSlot != null ? (
        <div className="h-full flex flex-col relative">
          {props.cardOverlaySlot}
          {props.frontTextSlot}
        </div>
      ) : null}
      {(props.showSwipeButtonList || props.showController) && (
        <div className={cx("fixed w-full bottom-2", "pb-5", props.showBackText && "invisible")}>
          {props.showSwipeButtonList && <SwipeButtonList {...props.swipeButtonList} />}
          {props.showController && <Controller {...props.controller} />}
        </div>
      )}
    </Layout>
  );
};
