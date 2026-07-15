import type * as React from "react";
import { Layout } from "@/shared/components/layout/Layout";
import { DeckForm, type DeckFormProps } from "@/features/deck/components/DeckForm";

export interface DeckFormTemplateProps {
  layout?: React.ComponentProps<typeof Layout>;
  deckForm?: DeckFormProps;
}

export const DeckFormTemplate: React.FC<DeckFormTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.deckForm != null && <DeckForm {...props.deckForm} />}
    </Layout>
  );
};
