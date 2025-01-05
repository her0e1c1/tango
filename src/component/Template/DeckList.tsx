import * as React from "react";
import * as Organism from "../Organism";
import { List } from "../Molecule";

export const DeckList: React.FC<{
  decks: Deck[];
  layout?: LayoutProps;
  deckCard?: DeckCardProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      <List>{props.decks?.map((deck, i) => <Organism.DeckCard key={i} deck={deck} {...props.deckCard} />)}</List>
    </Organism.Layout>
  );
};
