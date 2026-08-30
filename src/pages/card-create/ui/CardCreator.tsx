import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { CardFields, type CardFormFields } from "@/features/card-form";
import { Button } from "@/shared/ui/button";
import { Form } from "@/shared/ui/forms";

export interface CardCreatorProps {
  categories: readonly string[];
  deckName: string;
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

export const CardCreator: React.FC<CardCreatorProps> = ({ categories, deckName, form, onCancel, onSubmit }) => {
  const formState = useFormState({ control: form.control });

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
          Back to cards
        </button>
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card creator</p>
        <h1 className="mt-1 break-words text-display font-bold text-ink">Create card</h1>
        <p className="mt-2 text-body text-ink-muted">Add a card to {deckName}.</p>
      </header>
      <Form onSubmit={onSubmit}>
        <CardFields categories={categories} form={form} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? <span>Creating…</span> : <span>Create card</span>}
          </Button>
        </div>
      </Form>
    </section>
  );
};
