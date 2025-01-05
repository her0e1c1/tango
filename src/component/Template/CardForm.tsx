import * as React from "react";
import * as Organism from "../Organism";

export const CardForm: React.FC<{
  layout?: LayoutProps;
  cardForm?: CardFormProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      <Organism.CardForm {...props.cardForm} />
    </Organism.Layout>
  );
};
