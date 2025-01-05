import * as React from "react";
import cx from "classnames";

export const Textarea: React.FC<{
  className?: string;
  rows?: number;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}> = (props) => {
  return (
    <textarea
      ref={props.inputRef}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      rows={props.rows}
      className={cx(
        `shadow
         appearance-none
         border
         rounded
         w-full
         py-2
         px-3
         text-gray-700
         dark:bg-black
         dark:text-gray-100
         leading-tight
         focus:outline-none
         focus:shadow-outline`,
        props.className
      )}
    />
  );
};
