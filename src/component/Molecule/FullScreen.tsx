import cx from "classnames";
import * as React from "react";

export const FullScreen: React.FC<{
  className?: string;
  scroll?: boolean;
  center?: boolean;
  flex?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      onClick={props.onClick}
      className={cx([
        "dark:bg-black",
        "w-screen",
        "h-screen",
        props.flex && ["flex", "flex-col"],
        props.scroll ? "overflow-scroll" : "overflow-hidden",
        props.center && ["flex", "justify-center", "items-center"],
        props.className,
      ])}
    >
      {props.children}
    </div>
  );
};
