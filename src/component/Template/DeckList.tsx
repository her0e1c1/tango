import * as React from "react";
import * as Organism from "@src/component/Organism";
import { List } from "@src/shared/components";
import { Layout } from "@src/shared/components/Layout";

export const DeckList: React.FC<{
  decks: Deck[];
  layout?: LayoutProps;
  deckCard?: DeckCardProps;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <List>
        {props.decks?.map((deck, i) => (
          <Organism.DeckCard key={i} deck={deck} {...props.deckCard} />
        ))}
      </List>
    </Layout>
  );
};
