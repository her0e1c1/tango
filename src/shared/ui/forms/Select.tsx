/**
 * @file Defines the reusable Select component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

export interface Option {
  label: string;
  value: string;
}

/**
 * Renders the Select user interface.
 * Builds a select control from the supplied options and reports the chosen value through its
 * change handler.
 */
export const Select: React.FC<{
  options?: Option[];
  empty?: boolean;
  className?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  ref?: React.Ref<HTMLSelectElement>;
}> = ({
  options: originalOptions,
  empty,
  className,
  name,
  value,
  defaultValue,
  disabled,
  required,
  onChange,
  onBlur,
  ref,
}) => {
  let options = originalOptions;
  if (empty) {
    options = [{ label: "", value: "" }, ...(originalOptions ?? [])];
  }
  return (
    <select
      ref={ref}
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
      className={cx(
        "block min-h-touch w-full appearance-none rounded-control border border-border bg-surface px-4 py-2 pr-8 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted",
        className
      )}
    >
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};
