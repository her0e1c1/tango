import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { CardForm, type CardFormProps } from "@/features/card-edit";
import { Feedback } from "@/shared/ui/feedback";

export interface CardEditorProps {
  form: CardFormProps;
  saveError?: unknown;
}

export const CardEditor: React.FC<CardEditorProps> = ({ form, saveError }) => (
  <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
    <header className="mb-section-gap">
      <button
        type="button"
        className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
        onClick={form.onCancel}
      >
        <AiOutlineArrowLeft aria-hidden="true" />
        Back to cards
      </button>
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card editor</p>
      <h1 className="mt-1 break-words text-display font-bold text-ink">Edit card</h1>
      <p className="mt-2 text-body text-ink-muted">Update the prompt, answer, and organization for this card.</p>
    </header>
    <Feedback tone="error">{saveError == null ? null : "Unable to save changes. Try again."}</Feedback>
    <CardForm {...form} />
  </section>
);
