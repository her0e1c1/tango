import cx from "classnames";
import type * as React from "react";

export const Outer: React.FC<{ children?: React.ReactNode; className?: string }> = (props) => {
  return (
    <div
      className={cx(
        "bg-canvas",
        "text-ink",
        "cursor-default",
        "select-none",
        "h-dvh",
        "min-h-dvh",
        "w-full",
        "overflow-y-auto",
        "flex",
        "flex-col",
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
