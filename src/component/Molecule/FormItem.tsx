import cx from "classnames";
import React from "react";
import { Description } from "../Atom";

export const FormItem: React.FC<{
  label: string;
  extra?: string;
  text?: boolean;
  col?: boolean;
  children?: React.ReactNode;
}> = (props) => (
  <div className="w-full pb-2 md:pb-4">
    <div className={cx("flex", props.col && "flex-col md:flex-row")}>
      <div className="basis-full mr-2 md:basis-48 md:text-base dark:text-gray-400 mb-1 md:mb-0">{props.label}</div>
      <div className="flex-1 text-gray-500 md:text-right">{props.text ?? props.children}</div>
    </div>
    {props.extra != null && <Description label={props.extra} />}
  </div>
);
