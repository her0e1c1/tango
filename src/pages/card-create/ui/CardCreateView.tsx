import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Button } from "@/shared/ui/button";
import { TagList } from "@/shared/ui/content";
import { Feedback } from "@/shared/ui/feedback";
import { Form, FormItem, Tag, Textarea } from "@/shared/ui/forms";

import type { CardCreateFormProps } from "../model/useCardCreateState";

export interface CardCreateViewProps {
  deckName: string;
  form: CardCreateFormProps;
  saveError?: unknown;
}

export const CardCreateView: React.FC<CardCreateViewProps> = ({ deckName, form, saveError }) => {
  const idPrefix = useId();
  const frontInputId = `${idPrefix}-card-front-text`;
  const frontErrorId = `${frontInputId}-error`;
  const backInputId = `${idPrefix}-card-back-text`;
  const backErrorId = `${backInputId}-error`;

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <header className="mb-section-gap">
        <button
          type="button"
          disabled={form.isSubmitting}
          className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
          onClick={form.onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
          Back to cards
        </button>
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card creator</p>
        <h1 className="mt-1 break-words text-display font-bold text-ink">Add card</h1>
        <p className="mt-2 text-body text-ink-muted">Add a new prompt and answer to {deckName}.</p>
      </header>
      <Feedback tone="error">{saveError == null ? null : "Unable to create this card. Try again."}</Feedback>
      <Form onSubmit={form.onSubmit}>
        <section className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
          <FormItem
            col
            label="Front text"
            inputId={frontInputId}
            errorId={frontErrorId}
            {...(form.errors.frontText !== undefined ? { error: form.errors.frontText } : {})}
          >
            <Textarea
              rows={8}
              {...form.fields.frontText}
              id={frontInputId}
              aria-invalid={form.errors.frontText != null || undefined}
              aria-describedby={form.errors.frontText !== undefined ? frontErrorId : undefined}
              autoFocus
            />
          </FormItem>
          <FormItem
            col
            label="Back text"
            inputId={backInputId}
            errorId={backErrorId}
            {...(form.errors.backText !== undefined ? { error: form.errors.backText } : {})}
          >
            <Textarea
              rows={8}
              {...form.fields.backText}
              id={backInputId}
              aria-invalid={form.errors.backText != null || undefined}
              aria-describedby={form.errors.backText !== undefined ? backErrorId : undefined}
            />
          </FormItem>
          <FormItem col label="Tags">
            <TagList>
              {form.fields.tags.map(({ label, value, input }) => (
                <Tag className="mr-1 mb-1" primary small key={value} label={label} {...input} value={value} />
              ))}
            </TagList>
          </FormItem>
        </section>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" disabled={form.isSubmitting} onClick={form.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={form.isSubmitting}>
            Add card
          </Button>
        </div>
      </Form>
    </section>
  );
};
