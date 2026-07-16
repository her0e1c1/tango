import type * as React from "react";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";
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
        <h1 className="mb-section-gap break-words text-display font-bold text-ink">Edit card</h1>
        {props.feedbackSlot}
        {props.cardForm != null && <CardForm {...props.cardForm} />}
      </section>
    </Layout>
  );
};
