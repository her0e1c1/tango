import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import { Header, Card } from "./Common";
import { useDeck, useCurrentDeck } from "src/hooks/state";
import { CardItem } from "src/react-native/component";
import { useReplaceTo, useGoTo } from "src/react-native/hooks/action";
import * as action from "src/react-native/action";
import { useThunkAction } from "src/hooks";
import { RouteProp, useRoute } from "@react-navigation/native";

const Row = ({ card }: { card: Card }) => {
  const update = useThunkAction(action.goToCard(card.id));
  const replaceTo = useReplaceTo();
  const goTo = useGoTo();
  const deck = useDeck(card.deckId);
  const included = deck.cardOrderIds.includes(card.id);
  return (
    <CardItem
      name="edit"
      score={card.score}
      gray={!included}
      body={`${card.frontText}`}
      onPressItem={React.useCallback(async () => {
        if (!included) return;
        await update();
        await replaceTo("DeckSwiper", { deckId: card.deckId });
      }, [included, card.deckId])}
      onPress={React.useCallback(() => goTo("CardEdit", { cardId: card.id }), [
        card.id,
      ])}
    />
  );
};

export const CardList = (props: { deckId: string }) => {
  const deck = useDeck(props.deckId);
  return (
    <RN.FlatList
      data={deck.cardIds}
      keyExtractor={(id) => id}
      renderItem={({ item }) => (
        <Card id={item}>{(card) => <Row card={card} />}</Card>
      )}
    />
  );
};

export const CardListPage = () => {
  const route = useRoute<RouteProp<RouteParamList, "Deck">>();
  const { deckId } = route.params;
  const deck = useCurrentDeck(deckId);
  return (
    <NB.Container>
      <Header bodyText={deck.name} />
      <NB.Content scrollEnabled={false}>
        <CardList deckId={deckId} />
      </NB.Content>
    </NB.Container>
  );
};
