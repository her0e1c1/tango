import type * as React from "react";
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
      <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
        <h1 className="mb-section-gap break-words text-display font-bold text-ink">Edit deck</h1>
        {props.feedbackSlot}
        {props.deckForm != null && <DeckForm {...props.deckForm} />}
      </section>
    </Layout>
  );
};
