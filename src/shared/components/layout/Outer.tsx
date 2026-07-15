import cx from "classnames";
import type * as React from "react";

export const Outer: React.FC<{ children?: React.ReactNode; className?: string }> = (props) => {
  return (
    <div
      className={cx(
        "bg-canvas",
        "cursor-default",
        "select-none",
        "overflow-y-scroll",
        "h-screen",
        "flex",
        "flex-col",
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
