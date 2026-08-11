/**
 * @file Defines the reusable Input component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import cx from "classnames";

/**
 * Renders the Input user interface.
 * Renders the shared text input styling while forwarding its value, state, accessibility
 * attributes, and change handler.
 */
export const Input: React.FC<{
  id?: string;
  className?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-describedby"?: React.AriaAttributes["aria-describedby"];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
}> = ({
  id,
  className,
  name,
  type,
  value,
  defaultValue,
  disabled,
  readOnly,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder,
  onChange,
  onBlur,
  ref,
}) => {
  return (
    <input
      ref={ref}
      id={id}
      type={type}
      name={name}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      className={cx(
        "min-h-touch w-full appearance-none rounded-control border border-border bg-surface px-3 py-2 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted read-only:bg-surface-muted",
        className
      )}
    />
  );
};
