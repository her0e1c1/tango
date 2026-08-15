import type { DeckDomain } from "@/entities/deck";

import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Feedback } from "@/shared/ui/feedback";
import { useDeckEditAction } from "../model/useDeckEditAction";
import { useDeckFormState } from "../model/useDeckFormState";
import { DeckForm } from "./DeckForm";

export interface DeckEditFormProps {
  deck: DeckDomain;
  onCancel: () => void;
  onSaved: () => void;
}

export const DeckEditForm: React.FC<DeckEditFormProps> = ({ deck, onCancel, onSaved }) => {
  const editAction = useDeckEditAction({ onSaved });
  const deckForm = useDeckFormState({ deck, onCancel, onSubmit: editAction.update });

  return (
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
        <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{deck.name}</h1>
        <p className="mt-2 text-body text-ink-muted">Manage this deck’s information, import source, and formatting.</p>
      </header>
      <Feedback tone="error">{editAction.error == null ? null : "Unable to save changes. Try again."}</Feedback>
      <DeckForm {...deckForm} />
    </section>
  );
};
