import cx from "classnames";
import type * as React from "react";

export const Style: React.FC<{
  div?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  const Tag = props.div ? "div" : "span";
  return (
    <Tag onClick={props.onClick} className={cx("min-w-0 break-words text-ink", props.className)}>
      {props.children}
    </Tag>
  );
};
