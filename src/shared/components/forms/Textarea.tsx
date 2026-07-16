import type * as React from "react";
import cx from "classnames";

export const Textarea: React.FC<{
  className?: string;
  rows?: number;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}> = (props) => {
  return (
    <textarea
      ref={props.inputRef}
      name={props.name}
      value={props.value}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      readOnly={props.readOnly}
      placeholder={props.placeholder}
      onChange={props.onChange}
      onBlur={props.onBlur}
      rows={props.rows}
      className={cx(
        "w-full appearance-none rounded-control border border-border bg-surface px-3 py-2 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted read-only:bg-surface-muted",
        props.className
      )}
    />
  );
};
