import * as React from "react";
import { List } from "@src/shared/components";
import { Layout } from "@src/shared/components/layout/Layout";
import { DeckCard, type DeckCardProps } from "@src/features/deck/components/DeckCard";

export interface DeckListTemplateProps {
  decks: Deck[];
  layout?: React.ComponentProps<typeof Layout>;
  deckCard?: DeckCardProps;
}

export const DeckListTemplate: React.FC<DeckListTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <List>
        {props.decks?.map((deck, i) => (
          <DeckCard key={i} deck={deck} {...props.deckCard} />
        ))}
      </List>
    </Layout>
  );
};
