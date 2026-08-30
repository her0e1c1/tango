import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { type UseFormReturn, useFormState } from "react-hook-form";

import type { CardId } from "@/entities/card";
import { CardFields, type CardFormFields } from "@/features/card-form";
import { Button } from "@/shared/ui/button";
import { Feedback } from "@/shared/ui/feedback";
import { Form } from "@/shared/ui/forms";

export interface CardEditorProps {
  cardInfo: { uniqueKey: string; id: CardId; createdAt?: number; lastSeenAt?: number };
  categories: readonly string[];
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  saveError?: unknown;
}

const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString();

export const CardEditor: React.FC<CardEditorProps> = ({
  cardInfo,
  categories,
  form,
  onCancel,
  onSubmit,
  saveError,
}) => {
  const formState = useFormState({ control: form.control });

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <header className="mb-section-gap">
        <button
          type="button"
          className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
          onClick={onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
          Back to cards
        </button>
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card editor</p>
        <h1 className="mt-1 break-words text-display font-bold text-ink">Edit card</h1>
        <p className="mt-2 text-body text-ink-muted">Update the prompt, answer, and organization for this card.</p>
      </header>
      <Feedback tone="error">{saveError == null ? null : "Unable to save changes. Try again."}</Feedback>
      <Form onSubmit={onSubmit}>
        <CardFields categories={categories} form={form} />
        <details className="rounded-surface border border-border bg-surface-muted p-4">
          <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
            Card information
          </summary>
          <dl className="mt-4 grid gap-3 text-caption">
            <div className="min-w-0">
              <dt className="font-medium text-ink-muted">Unique key</dt>
              <dd className="break-all text-ink">{cardInfo.uniqueKey}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-medium text-ink-muted">ID</dt>
              <dd className="break-all text-ink">{cardInfo.id}</dd>
            </div>
            {cardInfo.createdAt !== undefined && (
              <div>
                <dt className="font-medium text-ink-muted">Created</dt>
                <dd className="text-ink">{formatDate(cardInfo.createdAt)}</dd>
              </div>
            )}
            {cardInfo.lastSeenAt !== undefined && (
              <div>
                <dt className="font-medium text-ink-muted">Last seen</dt>
                <dd className="text-ink">{formatDate(cardInfo.lastSeenAt)}</dd>
              </div>
            )}
          </dl>
        </details>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? <span>Saving…</span> : <span>Save changes</span>}
          </Button>
        </div>
      </Form>
    </section>
  );
};
