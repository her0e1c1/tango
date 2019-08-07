import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { Header, Card } from './Common';
import { useDeck, useCurrentDeck } from 'src/hooks/state';
import { IconItem } from 'src/react-native/component';
import { useReplaceTo, useGoTo } from 'src/react-native/hooks/action';
import * as action from 'src/react-native/action';
import { useThunkAction } from 'src/hooks';

const Row = ({ card }: { card: Card }) => {
  const update = useThunkAction(action.goToCard(card.id));
  const replaceTo = useReplaceTo();
  const goTo = useGoTo();
  return (
    <IconItem
      awsomeFont
      name="edit"
      body={`(${card.score}) ${card.frontText}`}
      onPressItem={React.useCallback(async () => {
        await update();
        await replaceTo('DeckSwiper', { deckId: card.deckId });
      }, [])}
      onPress={React.useCallback(
        () => goTo('CardEdit', { cardId: card.id }),
        []
      )}
    />
  );
};

export const CardList = (props: { deckId: string }) => {
  const deck = useDeck(props.deckId);
  return (
    <RN.FlatList
      data={deck.cardIds}
      keyExtractor={id => id}
      renderItem={({ item }) => (
        <Card id={item}>{card => <Row card={card} />}</Card>
      )}
    />
  );
};
export const CardListPage = () => {
  const deck = useCurrentDeck();
  return (
    <NB.Container>
      <Header body={{ title: deck.name }} />
      <NB.Content>
        <CardList deckId={deck.id} />
      </NB.Content>
    </NB.Container>
  );
};
