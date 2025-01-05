import cx from "classnames";
import * as React from "react";

export const Outer: React.FC<{ children?: React.ReactNode; className?: string }> = (props) => {
  return (
    <div
      className={cx(
        "bg-white",
        "cursor-default",
        "select-none",
        "dark:bg-black",
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
