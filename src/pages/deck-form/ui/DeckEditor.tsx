import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import type { UseFormReturn } from "react-hook-form";

import type { DeckId } from "@/entities/deck";
import { Button } from "@/shared/ui/button";

import type { DeckFormValues } from "../model/useDeckForm";
import { DeckForm } from "./DeckForm";

export interface DeckEditorProps {
  categories: readonly string[];
  deckName: string;
  deckInfo: { id: DeckId; createdAt: number; updatedAt: number };
  form: UseFormReturn<DeckFormValues>;
  isLocalOnly: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

export const DeckEditor: React.FC<DeckEditorProps> = ({
  categories,
  deckInfo,
  deckName,
  form,
  isLocalOnly,
  onCancel,
  onDelete,
  onSubmit,
}) => (
  <section className="mx-auto w-full max-w-reading overflow-hidden rounded-surface border border-border bg-surface p-4 md:p-6">
    <header className="mb-section-gap">
      <button
        type="button"
        className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
        onClick={onCancel}
      >
        <AiOutlineArrowLeft aria-hidden="true" />
        Back to decks
      </button>
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck settings</p>
      <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{deckName}</h1>
      <p className="mt-2 text-body text-ink-muted">Manage this deck’s information, import source, and formatting.</p>
    </header>
    <DeckForm
      categories={categories}
      deckInfo={deckInfo}
      form={form}
      isLocalOnly={isLocalOnly}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
    <section
      aria-labelledby="delete-deck-heading"
      className="mt-section-gap rounded-surface border border-danger p-4 md:p-5"
    >
      <h2 id="delete-deck-heading" className="text-title font-semibold text-danger">
        Danger zone
      </h2>
      <p className="mt-1 text-body text-ink-muted">Permanently delete this deck, its cards, and study session.</p>
      <Button className="mt-4" variant="destructive" onClick={onDelete}>
        Delete deck
      </Button>
    </section>
  </section>
);
