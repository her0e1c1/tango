import cx from "classnames";

export interface TagStyleOptions {
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  selected?: boolean;
}

/** Builds the shared CSS class list used by content and form tags. */
export const tagClassName = ({ className, compact, interactive, selected }: TagStyleOptions) =>
  cx(
    "inline-flex max-w-full min-w-0 items-center border font-medium",
    "rounded-control border-border bg-surface text-ink",
    compact ? "min-h-6 px-2 py-0.5 text-xs" : "min-h-touch min-w-touch px-3 py-2 text-sm",
    interactive &&
      "cursor-pointer transition-colors duration-fast ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    selected && "border-accent-primary bg-accent-primary/10 text-accent-primary",
    className
  );
