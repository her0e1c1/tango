import * as React from "react";
import * as Organism from "@src/component/Organism";
import { Layout } from "@src/shared/components/Layout";

export const DeckForm: React.FC<{
  layout?: LayoutProps;
  deckForm?: DeckFormProps;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.deckForm != null && <Organism.DeckForm {...props.deckForm} />}
    </Layout>
  );
};
