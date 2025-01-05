import cx from "classnames";
import * as React from "react";

export const Style: React.FC<{
  div?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  const Tag = props.div ? "div" : "span";
  return (
    <Tag onClick={props.onClick} className={cx("text-black", "dark:text-gray-300", "dark:bg-black", props.className)}>
      {props.children}
    </Tag>
  );
};
