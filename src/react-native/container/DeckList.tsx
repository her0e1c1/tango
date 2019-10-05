import * as React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import { useSelector } from 'react-redux';
import { SwipeRow } from 'src/react-native/component';
import { useGoTo, useIsLoading } from 'src/react-native/hooks/action';
import { Header, Deck } from './Common';
import * as action from 'src/react-native/action';
import { useThunkAction, useDispatch } from 'src/hooks';
import { useConfigAttr } from 'src/hooks/state';

const Row = ({ deck }: { deck: Deck }) => {
  const dispatch = useDispatch();
  const goTo = useGoTo();
  const deckDelete = useThunkAction(action.deckDelete(deck.id));
  const autoPlay = useConfigAttr('defaultAutoPlay');
  const goToStartPage = React.useCallback(async () => {
    if (deck.currentIndex <= 0) {
      await dispatch(action.deckUpdate({ id: deck.id, currentIndex: 0 }));
      goTo('DeckStart', { deckId: deck.id });
    } else {
      const c = { showBackText: false, autoPlay };
      await dispatch(action.type.configUpdate(c));
      goTo('DeckSwiper', { deckId: deck.id });
    }
  }, [deck.currentIndex, autoPlay]);
  const { setLoading, unsetLoading } = useIsLoading({
    isLoadingNoAction: true,
  });
  return (
    <SwipeRow
      title={deck.name}
      onPress={goToStartPage}
      onRightPress={React.useCallback(async () => {
        await setLoading();
        await deckDelete();
        await unsetLoading();
      }, [])}
      rightIcon="md-trash"
      onLeftPress={() => {
        NB.ActionSheet.show(
          {
            title: 'Deck Action',
            options: [
              'Show Card List',
              'Edit This Deck',
              'Restart Deck',
              'Upload To Google Spread Sheet',
              'Cancel',
            ],
            cancelButtonIndex: 4,
          },
          async index => {
            if (index === 0) {
              await goTo('CardList', { deckId: deck.id });
            } else if (index === 1) {
              await goTo('DeckEdit', { deckId: deck.id });
            } else if (index === 2) {
              await dispatch(
                action.deckUpdate({ id: deck.id, currentIndex: 0 })
              );
              goTo('DeckStart', { deckId: deck.id });
            } else if (index === 3) {
              await setLoading();
              await dispatch(action.sheetUpload(deck));
              await unsetLoading();
            }
          }
        );
      }}
    />
  );
};

export const DeckList = () => {
  const ids = useSelector((state: RootState) => Object.keys(state.deck.byId));
  return (
    <RN.FlatList
      data={ids as string[]}
      keyExtractor={id => id}
      renderItem={({ item }) => (
        <Deck id={item}>{deck => <Row deck={deck} />}</Deck>
      )}
    />
  );
};

export const DeckListPage = () => (
  <NB.Container>
    <Header body={{ title: 'Deck List' }} />
    <NB.Content>
      <DeckList />
    </NB.Content>
  </NB.Container>
);
