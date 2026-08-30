import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Feedback } from "@/shared/ui/feedback";
import { Form, FormItem, Input, Select, Switch } from "@/shared/ui/forms";

import type { DeckCreateFormValues } from "../model/useDeckCreateForm";

export interface DeckCreateViewProps {
  categories: readonly string[];
  form: UseFormReturn<DeckCreateFormValues>;
  isLocalModeLocked: boolean;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  saveError?: unknown;
}

export const DeckCreateView: React.FC<DeckCreateViewProps> = ({
  categories,
  form,
  isLocalModeLocked,
  onCancel,
  onSubmit,
  saveError,
}) => {
  const formState = useFormState({ control: form.control });
  const categoryOptions = categories.map((category) => ({ label: category, value: category }));
  const idPrefix = useId();
  const nameInputId = `${idPrefix}-deck-name`;
  const nameErrorId = `${nameInputId}-error`;

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <header className="mb-section-gap">
        <button
          type="button"
          disabled={formState.isSubmitting}
          className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
          onClick={onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
          Back to decks
        </button>
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck creator</p>
        <h1 className="mt-1 break-words text-display font-bold text-ink">Create deck</h1>
        <p className="mt-2 text-body text-ink-muted">Start with an empty deck.</p>
      </header>
      <Feedback tone="error">{saveError == null ? null : "Unable to create this deck. Try again."}</Feedback>
      <Form onSubmit={onSubmit}>
        <section className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
          <FormItem
            col
            label="Name"
            inputId={nameInputId}
            errorId={nameErrorId}
            {...(formState.errors.name?.message !== undefined ? { error: formState.errors.name.message } : {})}
          >
            <Input
              {...form.register("name")}
              id={nameInputId}
              aria-invalid={formState.errors.name != null || undefined}
              aria-describedby={formState.errors.name !== undefined ? nameErrorId : undefined}
              autoFocus
            />
          </FormItem>
          <FormItem col label="Category">
            <Select empty {...form.register("category")} options={categoryOptions} />
          </FormItem>
          <FormItem label="Local only" help="Keep this deck and its cards on this device.">
            <Switch {...form.register("localMode")} aria-label="Local only" disabled={isLocalModeLocked} />
          </FormItem>
        </section>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" disabled={formState.isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={formState.isSubmitting}>
            Create deck
          </Button>
        </div>
      </Form>
    </section>
  );
};
