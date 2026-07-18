import type React from "react";

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
}> = ({ min, max, step, disabled, name, value, onChange, onBlur, inputRef }) => {
  return (
    <div className="relative min-h-touch w-full">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-pill bg-surface-muted"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        disabled={disabled}
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="absolute inset-0 min-h-touch w-full appearance-none bg-transparent accent-accent-primary transition-opacity duration-fast ease-calm disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};
