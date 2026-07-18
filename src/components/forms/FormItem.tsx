import cx from "classnames";
import type React from "react";
import { Description } from "@/components/content/Description";

export const FormItem: React.FC<{
  label: string;
  extra?: string;
  help?: string;
  error?: string;
  text?: boolean;
  col?: boolean;
  children?: React.ReactNode;
}> = (props) => (
  <div className="w-full min-w-0">
    <div className={cx("flex gap-2", props.col && "flex-col md:flex-row")}>
      <div className="min-w-0 basis-full break-words text-body font-medium text-ink md:basis-48 md:shrink-0">
        {props.label}
      </div>
      <div className="min-w-0 flex-1 break-words text-ink-muted md:text-right">{props.text ?? props.children}</div>
    </div>
    {props.extra != null && <Description label={props.extra} />}
    {props.help != null && <Description label={props.help} />}
    {props.error != null && <div className="text-caption font-medium text-danger">{props.error}</div>}
  </div>
);
