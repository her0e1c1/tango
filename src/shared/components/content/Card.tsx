import cx from "classnames";
import type * as React from "react";

export const Card: React.FC<{
  className?: string;
  full?: boolean;
  disabled?: boolean;
  border?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div className={cx("flex", props.full ? "w-full" : ["w-full", "md:w-1/2", "lg:w-1/3"])}>
      <div
        className={cx(
          "flex min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-surface text-ink shadow-surface",
          props.disabled ? "bg-surface-muted" : "bg-surface",
          props.border && "border border-border",
          props.className
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
