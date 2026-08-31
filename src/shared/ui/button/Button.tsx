/**
 * @file Defines the reusable Button component.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  label?: string;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
  onClick?: () => void;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-ink-inverse hover:opacity-90",
  secondary: "bg-accent-secondary text-ink-inverse hover:opacity-90",
  quiet: "border border-border bg-transparent text-ink hover:bg-surface-muted",
  destructive: "bg-danger text-ink-inverse hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-touch min-w-touch px-3 py-1 font-semibold text-caption",
  md: "min-h-touch min-w-touch px-4 py-2 font-bold text-body",
  lg: "min-h-touch min-w-touch px-6 py-3 font-bold text-lg",
};

const resolveVariant = (props: ButtonProps): ButtonVariant => props.variant ?? "secondary";
const resolveSize = (props: ButtonProps): ButtonSize => props.size ?? "md";
const getLoadingAnnouncement = (content: React.ReactNode) =>
  typeof content === "string" || typeof content === "number" ? `Loading ${String(content)}` : "Loading";

/**
 * Renders the Button user interface.
 * Renders label or child content with the requested variant and size while announcing and
 * disabling loading work.
 */
export const Button: React.FC<ButtonProps> = ({ ref, ...props }) => {
  const variant = resolveVariant(props);
  const size = resolveSize(props);
  const inactive = props.disabled || props.loading;
  const content = props.label ?? props.children;
  const loadingAnnouncement = getLoadingAnnouncement(content);

  return (
    <>
      <button
        ref={ref}
        type={props.type ?? "button"}
        hidden={props.hidden}
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-control transition-opacity duration-fast ease-calm disabled:cursor-not-allowed disabled:opacity-50",
          { hidden: props.hidden },
          variantClasses[variant],
          sizeClasses[size],
          props.className
        )}
        disabled={inactive}
        aria-busy={props.loading || undefined}
        onClick={!inactive ? props.onClick : undefined}
      >
        {props.loading ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {content}
      </button>
      {props.loading && !props.hidden ? (
        <span role="status" aria-live="polite" className="sr-only">
          {loadingAnnouncement}
        </span>
      ) : null}
    </>
  );
};
