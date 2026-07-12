import React from "react";
import { Button, Section } from "@src/shared/components";
import { Layout } from "@src/shared/components/Layout";
import { DeckStartForm, type DeckStartFormProps } from "@src/features/deck/components/DeckStartForm";

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
      {props.deckStartForm != null && <DeckStartForm {...props.deckStartForm} />}
    </Layout>
  );
};
