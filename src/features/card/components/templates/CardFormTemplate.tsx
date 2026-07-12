import * as React from "react";
import { Layout } from "@src/shared/components/Layout";
import { CardForm, type CardFormProps } from "@src/features/card/components/CardForm";

export interface CardFormTemplateProps {
  layout?: LayoutProps;
  cardForm?: CardFormProps;
}

export const CardFormTemplate: React.FC<CardFormTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.cardForm != null && <CardForm {...props.cardForm} />}
    </Layout>
  );
};
