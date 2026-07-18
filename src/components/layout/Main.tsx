import cx from "classnames";
import type * as React from "react";

export const Main: React.FC<{ children?: React.ReactNode }> = (props) => {
  return (
    <div
      className={cx(
        "mx-auto",
        "mt-section-gap",
        "flex",
        "w-full",
        "max-w-content",
        "flex-1",
        "flex-col",
        "gap-section-gap",
        "rounded-surface",
        "bg-surface",
        "px-shell-gutter",
        "py-section-gap",
        "text-ink",
        "shadow-surface"
      )}
    >
      {props.children}
    </div>
  );
};
