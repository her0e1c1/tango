import cx from "classnames";
import * as React from "react";

export const Description: React.FC<{ label?: string; className?: string; children?: React.ReactNode }> = (props) => (
  <div className={cx("inline-block text-sm text-gray-500 dark:text-gray-500", props.className)}>
    {props.label ?? props.children}
  </div>
);
