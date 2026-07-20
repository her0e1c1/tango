/**
 * @file Defines the reusable Form Item component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type React from "react";
import { Description } from "@/components/content/Description";

/**
 * Renders the Form Item user interface.
 * Groups a control with its label, help text, extra information, and validation message using
 * linked identifiers.
 */
export const FormItem: React.FC<{
  label: string;
  inputId?: string;
  errorId?: string;
  extra?: string;
  help?: string;
  error?: string;
  text?: boolean;
  col?: boolean;
  children?: React.ReactNode;
}> = (props) => (
  <div className="w-full min-w-0">
    <div className={cx("flex gap-2", props.col && "flex-col md:flex-row")}>
      {props.inputId !== undefined ? (
        <label
          htmlFor={props.inputId}
          className="min-w-0 basis-full break-words text-body font-medium text-ink md:basis-48 md:shrink-0"
        >
          {props.label}
        </label>
      ) : (
        <div className="min-w-0 basis-full break-words text-body font-medium text-ink md:basis-48 md:shrink-0">
          {props.label}
        </div>
      )}
      <div className="min-w-0 flex-1 break-words text-ink-muted md:text-right">{props.text ?? props.children}</div>
    </div>
    {props.extra != null && <Description label={props.extra} />}
    {props.help != null && <Description label={props.help} />}
    {props.error != null && (
      <div id={props.errorId} className="text-caption font-medium text-danger">
        {props.error}
      </div>
    )}
  </div>
);
