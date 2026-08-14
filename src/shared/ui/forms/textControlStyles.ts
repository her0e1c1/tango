import cx from "classnames";

type TextControlKind = "select" | "text";

const baseClassName =
  "min-h-touch w-full appearance-none rounded-control border border-border bg-surface py-2 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted";

const kindClassNames: Record<TextControlKind, string> = {
  select: "block px-4 pr-8",
  text: "px-3 placeholder:text-ink-muted read-only:bg-surface-muted",
};

export const textControlClassName = (kind: TextControlKind, className?: string) =>
  cx(baseClassName, kindClassNames[kind], className);
