import cx from "classnames";
import type * as React from "react";

export const Description: React.FC<{ label?: string; className?: string; children?: React.ReactNode }> = (props) => (
  <div className={cx("inline-block min-w-0 break-words text-caption text-ink-muted", props.className)}>
    {props.label ?? props.children}
  </div>
);
