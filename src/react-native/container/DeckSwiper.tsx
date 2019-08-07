import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import {
  TextCard,
  Badge,
  WebviewCard,
  Overlay,
  DeckSwiper as DeckSwiperComponent,
  Controller as ControllerComponent,
} from 'src/react-native/component';
import {
  useScreen,
  useGoTo,
  useConfigUpdateInAdvance,
  useGoBack,
} from 'src/react-native/hooks/action';
import {
  useDeck,
  useCard,
  useConfigAttr,
  useCurrentDeck,
  useCardAttr,
} from 'src/hooks/state';
import { Header } from './Common';
import { useThunkAction, useDispatch } from 'src/hooks';
import * as action from 'src/react-native/action';

const useCardSwipe = (direction: SwipeDirection) => {
  const deck = useCurrentDeck();
  return useThunkAction(action.deckSwipe(direction, deck.id));
};

export const Controller = (props: { deckId: string }) => {
  const dispatch = useDispatch();
  const deck = useDeck(props.deckId);
  const [currentIndex, setIndex] = React.useState(deck.currentIndex);
  React.useEffect(() => {
    currentIndex !== deck.currentIndex &&
      dispatch(action.deckUpdate({ id: deck.id, currentIndex }));
  }, [currentIndex]);
  return (
    <ControllerComponent
      cardsLength={deck.cardOrderIds.length}
      deckCurrentIndex={deck.currentIndex}
      onSlidingComplete={setIndex}
    />
  );
};

export const CardView = (props: { frontText: boolean; cardId: string }) => {
  const ref = React.useRef<RN.WebView>(null);
  const deck = useCurrentDeck();
  const showBackText = useConfigUpdateInAdvance({
    showBackText: true,
    keepBackTextViewed: false,
  });
  const showBackTextLong = useConfigUpdateInAdvance({
    showBackText: true,
    keepBackTextViewed: true,
  });
  const card = useCard(props.cardId);
  const category = card.tags.length > 0 ? card.tags[0] : this.deck.category;
  const text = props.frontText ? card.frontText : card.backText;
  React.useEffect(() => {
    category &&
      ref.current &&
      ref.current.postMessage(JSON.stringify({ text, category }));
  });
  return !category || (props.frontText && deck.onlyBodyinWebview) ? (
    <TextCard
      body={text}
      onPress={showBackText}
      onLongPress={showBackTextLong}
    />
  ) : (
    <WebviewCard refWebView={ref} />
  );
};

export const DeckSwiper = (props: { deckId: string }) => {
  const deck = useDeck(props.deckId);
  const cardSwipeLeft = useCardSwipe('cardSwipeLeft');
  const cardSwipeUp = useCardSwipe('cardSwipeUp');
  const cardSwipeRight = useCardSwipe('cardSwipeRight');
  const cardSwipeDown = useCardSwipe('cardSwipeDown');
  return (
    <DeckSwiperComponent
      ids={deck.cardOrderIds}
      deckCurrentIndex={deck.currentIndex}
      swipeLeft={cardSwipeLeft}
      swipeTop={cardSwipeUp}
      swipeRight={cardSwipeRight}
      swipeDown={cardSwipeDown}
      onPress={useThunkAction(action.configToggle('showBackText'))} // better than to press inside <TextCard />
      renderCard={id => <CardView frontText cardId={id} />}
      // renderCard={id => ( <NB.View style={{ flex: 1}} />)}
    />
  );
};
const BackText = () => {
  const deck = useCurrentDeck();
  const showBackText = useConfigAttr('showBackText');
  const hideBackText = useConfigUpdateInAdvance({
    showBackText: false,
    keepBackTextViewed: false,
  });
  const cardId = deck.cardOrderIds[deck.currentIndex];
  return (
    <NB.View style={{ flex: 1, display: showBackText ? undefined : 'none' }}>
      <Overlay left onPress={useCardSwipe('cardSwipeLeft')} />
      <Overlay right onPress={useCardSwipe('cardSwipeRight')} />
      <Overlay bottom onPress={hideBackText} color="rgba(52, 52, 52, 0.1)'" />
      <CardView frontText={false} cardId={cardId} />
    </NB.View>
  );
};

const FrontText = () => {
  const goTo = useGoTo();
  const deck = useCurrentDeck();
  const showBackText = useConfigAttr('showBackText');
  const cardId = deck.cardOrderIds[deck.currentIndex];
  return (
    <NB.View style={{ flex: 1, display: showBackText ? 'none' : undefined }}>
      <Header
        bodyText={'HOGE'}
        // bodyText={deck.name}
        rightIcon="edit"
        rightOnPress={React.useCallback(() => goTo('CardEdit', { cardId }), [])}
      />
      <NB.View style={{ flex: 1 }}>
        <Overlay left onPress={useCardSwipe('cardSwipeLeft')} />
        <Overlay right onPress={useCardSwipe('cardSwipeRight')} />
        <Overlay top>
          <Badge text={String(useCardAttr(cardId, 'score'))} />
        </Overlay>
        {/* <CardView frontText cardId={deck.cardOrderIds[deck.currentIndex]} /> */}
        <DeckSwiper deckId={deck.id} />
        <NB.Footer>
          <NB.Body>
            <Controller deckId={deck.id} />
          </NB.Body>
        </NB.Footer>
      </NB.View>
    </NB.View>
  );
};

export const DeckSwiperPage = () => {
  useScreen();
  const dispatch = useDispatch();
  const goBack = useGoBack();
  const deck = useCurrentDeck();
  const index = deck.currentIndex;
  const valid = 0 <= index && index < deck.cardOrderIds.length;
  React.useEffect(() => {
    if (!valid) {
      dispatch(action.type.deckUpdate({ id: deck.id, currentIndex: 0 }));
      goBack();
    }
  }, [valid]);
  if (!valid) return <NB.Container />;
  return (
    <NB.Container>
      <BackText />
      <FrontText />
    </NB.Container>
  );
};
