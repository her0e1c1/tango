import React from "react";

export const Slider: React.FC<{
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  return (
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      disabled={props.disabled}
      ref={props.inputRef}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      className={`
        w-full h-2 bg-blue-100 appearance-none dark:bg-blue-900
       disabled:bg-gray-100
       dark:disabled:bg-gray-900
      `}
    />
  );
};
