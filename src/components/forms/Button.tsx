import cx from "classnames";
import type * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  label?: string;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** @deprecated Use size="sm". */
  small?: boolean;
  /** @deprecated Use size="lg". */
  large?: boolean;
  /** @deprecated The secondary variant is the default. */
  default?: boolean;
  /** @deprecated Use variant="primary". */
  primary?: boolean;
  children?: React.ReactNode;
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

export const Button: React.FC<ButtonProps> = (props) => {
  const variant = props.variant ?? (props.primary ? "primary" : "secondary");
  const size = props.size ?? (props.small ? "sm" : props.large ? "lg" : "md");
  const inactive = props.disabled || props.loading;
  const content = props.label ?? props.children;
  const loadingAnnouncement =
    typeof content === "string" || typeof content === "number" ? `Loading ${content}` : "Loading";

  return (
    <>
      <button
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
