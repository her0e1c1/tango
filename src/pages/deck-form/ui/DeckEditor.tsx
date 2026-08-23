import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Button } from "@/shared/ui/button";
import { Feedback } from "@/shared/ui/feedback";

import { DeckForm, type DeckFormProps } from "./DeckForm";

export interface DeckEditorProps {
  deckName: string;
  form: DeckFormProps;
  saveError?: unknown;
  onDelete: () => void;
}

export const DeckEditor: React.FC<DeckEditorProps> = ({ deckName, form, saveError, onDelete }) => (
  <section className="mx-auto w-full max-w-reading overflow-hidden rounded-surface border border-border bg-surface p-4 md:p-6">
    <header className="mb-section-gap">
      <button
        type="button"
        className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
        onClick={form.onCancel}
      >
        <AiOutlineArrowLeft aria-hidden="true" />
        Back to decks
      </button>
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck settings</p>
      <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{deckName}</h1>
      <p className="mt-2 text-body text-ink-muted">Manage this deck’s information, import source, and formatting.</p>
    </header>
    <Feedback tone="error">{saveError == null ? null : "Unable to save changes. Try again."}</Feedback>
    <DeckForm {...form} />
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
