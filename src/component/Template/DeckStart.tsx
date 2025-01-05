import React from "react";
import * as Organism from "../Organism";
import { Button, Section } from "../Atom";

export const DeckStart: React.FC<{
  layout?: LayoutProps;
  deckStartForm?: DeckStartFormProps;
  config: ConfigState;
  cardsLength: number;
  onClickStart?: () => void;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      <Section page title="Filter Cards" />
      <div className="flex justify-center">
        <Button
          primary
          disabled={props.cardsLength === 0}
          onClick={props.onClickStart}
          label={`Start to study ${Math.min(props.cardsLength, props.config.maxNumberOfCardsToLearn)} card(s) from ${
            props.cardsLength
          }`}
        />
      </div>
      {props.deckStartForm != null && <Organism.DeckStartForm {...props.deckStartForm} />}
    </Organism.Layout>
  );
};
