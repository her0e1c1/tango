/**
 * @file Defines the reusable Tag component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

import { tagClassName } from "@/components/content/tagStyles";

/**
 * Renders the Tag user interface.
 * Displays a tag-shaped control with optional size and selection styles and forwards click
 * interaction when provided.
 */
export const Tag: React.FC<{
  className?: string;
  round?: boolean;
  small?: boolean;
  large?: boolean;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  default?: boolean;
  primary?: boolean;
  hidden?: boolean;
  wrap?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
  children?: React.ReactNode;
}> = ({
  className,
  small,
  large,
  label,
  checked,
  disabled,
  hidden,
  wrap,
  name,
  value,
  onChange,
  onBlur,
  ref,
  children,
}) => {
  return (
    <label className={cx("inline-block", wrap && "min-w-0 max-w-full", { hidden })}>
      <input
        readOnly
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <span
        className={cx(
          tagClassName({
            interactive: onChange != null && !disabled,
            ...(className !== undefined ? { className } : {}),
          }),
          "select-none justify-center align-middle",
          wrap ? "min-w-0 max-w-full whitespace-normal break-all" : "whitespace-nowrap",
          "before:mr-2 before:size-2 before:shrink-0 before:rounded-pill before:bg-ink-muted before:content-['']",
          "peer-checked:border-accent-primary peer-checked:bg-accent-primary/10 peer-checked:text-accent-primary",
          "peer-checked:before:bg-accent-primary peer-checked:before:ring-2 peer-checked:before:ring-accent-primary/20",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          large ? "px-4 text-lg" : small ? "px-2 text-xs" : undefined
        )}
      >
        <span className={cx("min-w-0", wrap ? "break-all" : "truncate")}>{label ?? children}</span>
      </span>
    </label>
  );
};
