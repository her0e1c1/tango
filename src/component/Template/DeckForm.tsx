import * as React from "react";
import * as Organism from "../Organism";

export const DeckForm: React.FC<{
  layout?: LayoutProps;
  deckForm?: DeckFormProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      {props.deckForm != null && <Organism.DeckForm {...props.deckForm} />}
    </Organism.Layout>
  );
};
