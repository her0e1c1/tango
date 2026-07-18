import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

import { Layout, type LayoutProps } from "@/components/layout/Layout";
import { CardForm, type CardFormProps } from "@/features/card/components/CardForm";

export interface CardFormTemplateProps {
  layout?: LayoutProps;
  cardForm?: CardFormProps;
  feedbackSlot?: React.ReactNode;
}

export const CardFormTemplate: React.FC<CardFormTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
        <header className="mb-section-gap">
          {props.cardForm?.onCancel != null && (
            <button
              type="button"
              className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
              onClick={props.cardForm.onCancel}
            >
              <AiOutlineArrowLeft aria-hidden="true" />
              Back to cards
            </button>
          )}
          <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card editor</p>
          <h1 className="mt-1 break-words text-display font-bold text-ink">Edit card</h1>
          <p className="mt-2 text-body text-ink-muted">
            Update the prompt, answer, and organization for this card.
          </p>
        </header>
        {props.feedbackSlot}
        {props.cardForm != null && <CardForm {...props.cardForm} />}
      </section>
    </Layout>
  );
};
