/**
 * @file Defines the reusable Upload component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";

/**
 * Renders the Upload user interface.
 * Presents a file picker, displays the selected file name, and passes the chosen File to onChange.
 */
export const Upload: React.FC<{
  className?: string;
  disabled?: boolean;
  fileName?: string;
  onChange?: (file: File) => void;
}> = (props) => (
  <label
    className={cx(
      "flex h-48 max-w-sm rounded-surface border-2 border-border bg-surface text-ink shadow-surface transition-shadow duration-normal ease-calm",
      props.fileName ? "border-solid shadow-elevated" : "border-dashed",
      props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      props.className
    )}
  >
    <div className="relative flex-1">
      <div className="absolute flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
        <AiOutlineCloudUpload size={24} className="text-xl text-accent-primary" />
        <span className="text-base tracking-wide text-ink-muted">Upload a csv file</span>
        {props.fileName ? <span className="max-w-full truncate font-semibold text-ink">{props.fileName}</span> : null}
      </div>
      <input
        type="file"
        className="h-full w-full cursor-inherit opacity-0"
        accept=".csv"
        disabled={props.disabled}
        onChange={(e) => {
          if (e.target.files != null) {
            const file = e.target.files[0];
            if (file != null) {
              props.onChange?.(file);
            }
          }
        }}
      />
    </div>
  </label>
);
