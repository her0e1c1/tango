import React from "react";
import * as Organism from "@src/component/Organism";
import { Button, Section } from "@src/shared/components";
import { Layout } from "@src/shared/components/Layout";

export const DeckStart: React.FC<{
  layout?: LayoutProps;
  deckStartForm?: DeckStartFormProps;
  config: ConfigState;
  cardsLength: number;
  onClickStart?: () => void;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
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
    </Layout>
  );
};
