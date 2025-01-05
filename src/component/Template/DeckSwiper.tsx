import cx from "classnames";
import * as React from "react";
import * as Molecule from "../Molecule";
import * as Organism from "../Organism";

export const DeckSwiper: React.FC<{
  showHeader?: boolean;
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  layout?: LayoutProps;
  card?: Card;
  backText?: BackTextProps;
  frontText?: FrontTextProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
}> = (props) => {
  return (
    <Organism.Layout
      fullscreen
      showHeader={props.showHeader && !props.showBackText}
      scroll={props.showBackText}
      {...props.layout}
    >
      {props.showBackText && props.backText != null ? (
        <>
          <Molecule.Overlay position="left" onClick={props.frontText?.onSwipeLeft} />
          <Molecule.Overlay position="right" onClick={props.frontText?.onSwipeRight} />
          <Molecule.Overlay position="top" onClick={props.frontText?.onSwipeUp} />
          <Molecule.Overlay position="bottom" onClick={props.frontText?.onSwipeDown} />
          <div className="h-full flex pb-8">
            <Organism.BackText {...props.backText} />
          </div>
        </>
      ) : props.frontText != null ? (
        <div className="h-full flex flex-col relative">
          <Organism.CardOverlay card={props.card} />
          <Organism.FrontText {...props.frontText} />
        </div>
      ) : null}
      {(props.showSwipeButtonList || props.showController) && (
        <div className={cx("fixed w-full bottom-2", "pb-5", props.showBackText && "invisible")}>
          {props.showSwipeButtonList && <Organism.SwipeButtonList {...props.swipeButtonList} />}
          {props.showController && <Organism.Controller {...props.controller} />}
        </div>
      )}
    </Organism.Layout>
  );
};
