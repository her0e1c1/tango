import * as React from "react";
import { List, Overlay } from "../Molecule";
import * as Organism from "../Organism";
import * as util from "src/util";

export const CardList: React.FC<{
  deck: Deck;
  cards: Card[];
  layout?: LayoutProps;
  tags?: string[];
  card?: CardProps;
  onSubmit?: (data: Deck) => void;
  showCard?: Card;
}> = (props) => {
  const [showCard, setShowCard] = React.useState(props.showCard);
  return (
    <Organism.Layout showHeader {...props.layout}>
      {showCard != null && (
        <Overlay position="center" className="overflow-scroll bg-inherit" onClick={() => setShowCard(undefined)}>
          <Organism.BackText text={showCard.backText} category={util.getCategory(props.deck.category, showCard.tags)} />
        </Overlay>
      )}
      <details className="sticky top-0 bg-inherit py-2 max-h-screen">
        <summary className="cursor-pointer border-b border-gray-300 dark:border-gray-600 pb-1 mb-1">filter</summary>
        <Organism.DeckStartForm deck={props.deck} tags={props.tags ?? []} onSubmit={props.onSubmit} />
      </details>
      <List col1>
        {props.cards?.map((c, i) => (
          <Organism.Card
            key={i}
            card={c}
            onSwipedLeft={props.card?.onSwipedLeft}
            onSwipedRight={props.card?.onSwipedRight}
            onDelete={props.card?.onDelete}
            goToEdit={props.card?.goToEdit}
            goToView={() => setShowCard(c)}
          />
        ))}
      </List>
    </Organism.Layout>
  );
};
