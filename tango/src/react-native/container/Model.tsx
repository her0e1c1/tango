import * as React from "react";
import { useDeck, useCard } from "src/hooks/state";

export const Deck = (props: {
  id: string;
  children: (deck: Deck) => React.ReactElement;
}) => {
  const deck = useDeck(props.id);
  return props.children(deck);
};

export const Card = (props: {
  id: string;
  empty?: boolean;
  children: (deck: Card) => React.ReactElement;
}) => {
  const card = useCard(props.id, { empty: props.empty });
  return props.children(card);
};
