/**
 * @file Defines the reusable Textarea component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import cx from "classnames";

/**
 * Renders the Textarea user interface.
 * Renders the shared multiline input styling while forwarding its value, row count, validation
 * state, and change handler.
 */
export const Textarea: React.FC<{
  id?: string;
  className?: string;
  rows?: number;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-describedby"?: React.AriaAttributes["aria-describedby"];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  ref?: React.Ref<HTMLTextAreaElement>;
}> = ({
  id,
  className,
  rows,
  name,
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
    <textarea
      ref={ref}
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      rows={rows}
      className={cx(
        "min-h-touch w-full appearance-none rounded-control border border-border bg-surface px-3 py-2 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted read-only:bg-surface-muted",
        className
      )}
    />
  );
};
