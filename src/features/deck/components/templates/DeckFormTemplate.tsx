import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Layout } from "@/shared/components/layout/Layout";
import { DeckForm, type DeckFormProps } from "@/features/deck/components/DeckForm";

export interface DeckFormTemplateProps {
  layout?: React.ComponentProps<typeof Layout>;
  deckForm?: DeckFormProps;
  feedbackSlot?: React.ReactNode;
}

export const DeckFormTemplate: React.FC<DeckFormTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <section className="mx-auto w-full max-w-reading overflow-hidden rounded-surface border border-border bg-surface p-4 md:p-6">
        <header className="mb-section-gap">
          {props.deckForm?.onCancel != null && (
            <button
              type="button"
              className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
              onClick={props.deckForm.onCancel}
            >
              <AiOutlineArrowLeft aria-hidden="true" />
              Back to decks
            </button>
          )}
          <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck settings</p>
          <h1 className="mt-1 break-words text-display font-bold text-ink">
            {props.deckForm?.deck.name ?? "Deck settings"}
          </h1>
          <p className="mt-2 text-body text-ink-muted">
            Manage this deck’s information, import source, and formatting.
          </p>
        </header>
        {props.feedbackSlot}
        {props.deckForm != null && <DeckForm {...props.deckForm} />}
      </section>
    </Layout>
  );
};
