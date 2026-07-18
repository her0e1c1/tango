import type * as React from "react";
import cx from "classnames";

export const TagList: React.FC<{
  hasManyItems?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      className={cx("flex min-w-0 flex-wrap gap-2 overflow-x-hidden", props.hasManyItems && "max-h-64 overflow-y-auto")}
    >
      {props.children}
    </div>
  );
};
