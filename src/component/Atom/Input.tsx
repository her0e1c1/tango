import * as React from "react";
import cx from "classnames";

export const Input: React.FC<{
  className?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  return (
    <input
      ref={props.inputRef}
      type={props.type}
      name={props.name}
      defaultValue={props.defaultValue}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
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
