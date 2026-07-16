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
      {props.feedbackSlot}
      {props.cardForm != null && <CardForm {...props.cardForm} />}
    </Layout>
  );
};
