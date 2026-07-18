import type * as React from "react";
import cx from "classnames";

export const TagList: React.FC<{
  hasManyItems?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      className={cx(
        "flex min-w-0 gap-2 overflow-x-hidden",
        props.hasManyItems ? "max-h-64 flex-col flex-nowrap overflow-y-auto" : "flex-wrap"
      )}
    >
      {props.children}
    </div>
  );
};
