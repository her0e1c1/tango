import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import type { UseFormReturn } from "react-hook-form";

import type { CardId } from "@/entities/card";
import { Feedback } from "@/shared/ui/feedback";

import type { CardFormValues } from "../model/useCardForm";
import { CardForm } from "./CardForm";

export interface CardEditorProps {
  cardInfo: { uniqueKey: string; id: CardId; createdAt?: number; lastSeenAt?: number };
  categories: readonly string[];
  form: UseFormReturn<CardFormValues>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  saveError?: unknown;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  cardInfo,
  categories,
  form,
  onCancel,
  onSubmit,
  saveError,
}) => (
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
    <CardForm cardInfo={cardInfo} categories={categories} form={form} onCancel={onCancel} onSubmit={onSubmit} />
  </section>
);
