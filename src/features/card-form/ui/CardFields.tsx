import * as React from "react";
import cx from "classnames";
import { useTranslation } from "react-i18next";
import { type UseFormReturn, useController, useFormState } from "react-hook-form";
import { AiOutlineExpandAlt, AiOutlineRight } from "react-icons/ai";

import { focusableElementSelector } from "@/shared/lib/focusableElementSelector";
import { Tag, Textarea } from "@/shared/ui/forms";
import { useToastModalFocusTarget } from "@/shared/ui/toast";

export interface CardFormFields {
  frontText: string;
  backText: string;
  tags: string[];
}

export interface CardFieldsProps {
  categories: readonly string[];
  form: UseFormReturn<CardFormFields>;
}

type CardSide = "frontText" | "backText";

interface CardFieldsDialogProps {
  title: string;
  expanded?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const CardFieldsDialog = ({ title, expanded = false, onClose, children }: CardFieldsDialogProps) => {
  const { t } = useTranslation();
  const titleId = React.useId();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  useToastModalFocusTarget(dialogRef, closeRef);

  React.useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const handleKeyDown = React.useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === "Tab") {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementSelector) ?? []);
      const [first] = focusable;
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "flex w-full max-w-reading flex-col border border-border bg-surface-elevated text-ink shadow-elevated sm:rounded-surface",
          expanded ? "h-dvh sm:h-[85dvh]" : "max-h-[85dvh] rounded-t-surface"
        )}
      >
        {/* The page uses viewport-fit=cover, so edge-aligned dialogs must clear device cutouts and the home indicator. */}
        <header
          className={cx(
            "flex shrink-0 items-center justify-between gap-4 border-b border-border pb-3 pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))]",
            expanded ? "pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-3" : "pt-3"
          )}
        >
          <h2 id={titleId} className="min-w-0 break-words text-body font-semibold">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="min-h-touch shrink-0 rounded-control px-4 font-semibold text-accent-primary hover:bg-surface-muted"
            onClick={onClose}
          >
            {t("cardForm.done")}
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))]">
          {children}
        </div>
      </div>
    </div>
  );
};

export const CardFields = ({ categories, form }: CardFieldsProps) => {
  const { t } = useTranslation();
  const formState = useFormState({ control: form.control });
  const { field: frontField } = useController({ name: "frontText", control: form.control });
  const { field: backField } = useController({ name: "backText", control: form.control });
  const { field: tagsField } = useController({ name: "tags", control: form.control });
  const [activeSide, setActiveSide] = React.useState<CardSide>("frontText");
  const [expanded, setExpanded] = React.useState(false);
  const [tagOptions, setTagOptions] = React.useState<readonly string[] | null>(null);
  const [validation, setValidation] = React.useState<{ count: number; side: CardSide | null }>({
    count: formState.submitCount,
    side: null,
  });
  const id = React.useId();
  const frontTabRef = React.useRef<HTMLButtonElement>(null);
  const backTabRef = React.useRef<HTMLButtonElement>(null);

  // A failed submission must reveal its first invalid side before React Hook Form can focus that input.
  if (validation.count !== formState.submitCount) {
    const side = formState.errors.frontText ? "frontText" : formState.errors.backText ? "backText" : null;
    setValidation({ count: formState.submitCount, side });
    if (side) setActiveSide(side);
  }
  React.useEffect(() => {
    if (validation.side) form.setFocus(validation.side);
  }, [form, validation]);

  const sides = [
    {
      name: "frontText",
      title: t("cardForm.front.title"),
      label: t("cardForm.front.label"),
      field: frontField,
    },
    {
      name: "backText",
      title: t("cardForm.backSide.title"),
      label: t("cardForm.backSide.label"),
      field: backField,
    },
  ] as const;
  const active = activeSide === "frontText" ? sides[0] : sides[1];
  const activeError = formState.errors[activeSide];
  const expandedErrorId = `${id}-expanded-error`;
  const tags = tagsField.value;
  const tagsSummaryId = `${id}-tags-summary`;

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextSide: CardSide;
    if (event.key === "Home") nextSide = "frontText";
    else if (event.key === "End") nextSide = "backText";
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      nextSide = activeSide === "frontText" ? "backText" : "frontText";
    } else return;
    event.preventDefault();
    setActiveSide(nextSide);
    (nextSide === "frontText" ? frontTabRef : backTabRef).current?.focus();
  };

  return (
    <>
      <section className="min-w-0 space-y-3" aria-label={t("cardForm.content")}>
        <div
          role="tablist"
          aria-label={t("cardForm.content")}
          className="flex gap-1 rounded-control bg-surface-muted p-1"
        >
          {sides.map((side) => (
            <button
              key={side.name}
              ref={side.name === "frontText" ? frontTabRef : backTabRef}
              type="button"
              role="tab"
              id={`${id}-${side.name}-tab`}
              aria-controls={`${id}-${side.name}-panel`}
              aria-selected={activeSide === side.name}
              aria-describedby={formState.errors[side.name] ? `${id}-${side.name}-error` : undefined}
              tabIndex={activeSide === side.name ? 0 : -1}
              onClick={() => setActiveSide(side.name)}
              onKeyDown={handleTabKeyDown}
              className={cx(
                "min-h-touch min-w-0 flex-1 rounded-control px-3 py-2 text-body font-semibold",
                activeSide === side.name
                  ? "bg-surface text-accent-primary shadow-surface"
                  : "text-ink-muted hover:bg-surface"
              )}
            >
              {side.title}
              {formState.errors[side.name] != null && (
                <span aria-hidden="true" className="ml-2 text-danger">
                  ●
                </span>
              )}
            </button>
          ))}
        </div>
        {sides.map((side) => {
          const inputId = `${id}-${side.name}`;
          const errorId = `${inputId}-error`;
          const error = formState.errors[side.name];
          return (
            <div
              key={side.name}
              role="tabpanel"
              id={`${inputId}-panel`}
              aria-labelledby={`${inputId}-tab`}
              hidden={activeSide !== side.name}
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={inputId} className="text-caption font-medium text-ink-muted">
                  {side.label}
                </label>
                <button
                  type="button"
                  aria-label={t("cardForm.expandSide", { side: side.title })}
                  onClick={() => setExpanded(true)}
                  className="inline-flex min-h-touch items-center gap-2 rounded-control px-3 text-caption font-semibold text-accent-primary hover:bg-surface-muted"
                >
                  <AiOutlineExpandAlt aria-hidden="true" />
                  {t("cardForm.expand")}
                </button>
              </div>
              <Textarea
                {...side.field}
                id={inputId}
                rows={12}
                className="min-h-[min(45dvh,24rem)] text-lg leading-relaxed"
                aria-invalid={error != null || undefined}
                aria-describedby={error ? errorId : undefined}
              />
              {error?.message !== undefined && (
                <p id={errorId} role="alert" className="text-caption font-medium text-danger">
                  {error.message}
                </p>
              )}
            </div>
          );
        })}
      </section>
      <button
        type="button"
        aria-label={t("cardForm.tags.edit")}
        aria-describedby={tagsSummaryId}
        aria-haspopup="dialog"
        aria-expanded={tagOptions !== null}
        onClick={() => {
          // Keep imported tags in the open list even after deselection so they can be selected again.
          setTagOptions([...new Set([...categories, ...tags])]);
        }}
        className="flex min-h-14 w-full min-w-0 items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-left hover:bg-surface-muted"
      >
        <span className="shrink-0 text-caption text-ink-muted">{t("cardForm.tags.title")}</span>
        <span className="flex min-w-0 flex-1 items-center gap-1">
          {tags.length === 0 && (
            <span className="truncate text-caption text-ink-muted">{t("cardForm.tags.empty")}</span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="max-w-28 truncate rounded bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && <span className="shrink-0 text-caption text-ink-muted">+{tags.length - 2}</span>}
        </span>
        <AiOutlineRight className="shrink-0 text-accent-primary" aria-hidden="true" />
        <span id={tagsSummaryId} className="sr-only">
          {tags.length === 0 ? t("cardForm.tags.empty") : tags.join(", ")}
        </span>
      </button>
      {tagOptions !== null && (
        <CardFieldsDialog title={t("cardForm.tags.select")} onClose={() => setTagOptions(null)}>
          <fieldset className="flex flex-wrap gap-2" aria-label={t("cardForm.tags.title")}>
            {tagOptions.map((tag) => (
              <Tag
                key={tag}
                label={tag}
                value={tag}
                wrap
                checked={tags.includes(tag)}
                onChange={(event) =>
                  tagsField.onChange(event.target.checked ? [...tags, tag] : tags.filter((value) => value !== tag))
                }
                onBlur={tagsField.onBlur}
              />
            ))}
          </fieldset>
        </CardFieldsDialog>
      )}
      {expanded ? (
        <CardFieldsDialog title={active.label} expanded onClose={() => setExpanded(false)}>
          <div className="flex h-full min-h-0 flex-col gap-2">
            {/* Keep the registered focus target in its tab while both editors share the same form value. */}
            <Textarea
              value={active.field.value}
              onChange={active.field.onChange}
              onBlur={active.field.onBlur}
              aria-label={active.label}
              aria-invalid={activeError != null || undefined}
              aria-describedby={activeError ? expandedErrorId : undefined}
              className="min-h-48 flex-1 resize-none text-xl leading-relaxed"
            />
            {activeError?.message !== undefined && (
              <p id={expandedErrorId} role="alert" className="shrink-0 text-caption font-medium text-danger">
                {activeError.message}
              </p>
            )}
          </div>
        </CardFieldsDialog>
      ) : null}
    </>
  );
};
