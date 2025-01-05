import * as React from "react";
import cx from "classnames";

export const TagList: React.FC<{
  hasManyItems?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div className={cx("gap-2", "flex", "flex-wrap", "overflow-scroll", props.hasManyItems && "flex-col max-h-64")}>
      {props.children}
    </div>
  );
};
