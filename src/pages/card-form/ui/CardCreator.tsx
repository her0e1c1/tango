import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import type { UseFormReturn } from "react-hook-form";

import { Feedback } from "@/shared/ui/feedback";

import { CardForm, type CardFormFields } from "./CardForm";

export interface CardCreatorProps {
  categories: readonly string[];
  deckName: string;
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  saveError?: unknown;
}

export const CardCreator: React.FC<CardCreatorProps> = ({
  categories,
  deckName,
  form,
  onCancel,
  onSubmit,
  saveError,
}) => (
  <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
    <header className="mb-section-gap">
      <button
        type="button"
        disabled={form.formState.isSubmitting}
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
    <Feedback tone="error">{saveError == null ? null : "Unable to create this card. Try again."}</Feedback>
    <CardForm
      categories={categories}
      form={form}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel="Create card"
      submittingLabel="Creating…"
    />
  </section>
);
