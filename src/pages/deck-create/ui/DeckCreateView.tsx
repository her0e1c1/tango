import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Button } from "@/shared/ui/button";
import { Feedback } from "@/shared/ui/feedback";
import { Form, FormItem, Input, Select, Switch } from "@/shared/ui/forms";

interface DeckCreateFields {
  name: React.ComponentProps<typeof Input>;
  category: React.ComponentProps<typeof Select>;
  localMode: React.ComponentProps<typeof Switch>;
}

interface DeckCreateFormProps {
  fields: DeckCreateFields;
  errors: { name: string | undefined };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: NonNullable<React.ComponentProps<typeof Form>["onSubmit"]>;
}

export interface DeckCreateViewProps {
  form: DeckCreateFormProps;
  saveError?: unknown;
}

export const DeckCreateView: React.FC<DeckCreateViewProps> = ({ form, saveError }) => {
  const idPrefix = useId();
  const nameInputId = `${idPrefix}-deck-name`;
  const nameErrorId = `${nameInputId}-error`;

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
          Back to decks
        </button>
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck creator</p>
        <h1 className="mt-1 break-words text-display font-bold text-ink">Create deck</h1>
        <p className="mt-2 text-body text-ink-muted">Start with an empty deck.</p>
      </header>
      <Feedback tone="error">{saveError == null ? null : "Unable to create this deck. Try again."}</Feedback>
      <Form onSubmit={form.onSubmit}>
        <section className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
          <FormItem
            col
            label="Name"
            inputId={nameInputId}
            errorId={nameErrorId}
            {...(form.errors.name !== undefined ? { error: form.errors.name } : {})}
          >
            <Input
              {...form.fields.name}
              id={nameInputId}
              aria-invalid={form.errors.name != null || undefined}
              aria-describedby={form.errors.name !== undefined ? nameErrorId : undefined}
              autoFocus
            />
          </FormItem>
          <FormItem col label="Category">
            <Select empty {...form.fields.category} />
          </FormItem>
          <FormItem label="Local only" help="Keep this deck and its cards on this device.">
            <Switch {...form.fields.localMode} aria-label="Local only" />
          </FormItem>
        </section>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" disabled={form.isSubmitting} onClick={form.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={form.isSubmitting}>
            Create deck
          </Button>
        </div>
      </Form>
    </section>
  );
};
