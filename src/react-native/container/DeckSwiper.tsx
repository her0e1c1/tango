import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import {
  TextCard,
  Badge,
  WebviewCard,
  Overlay,
  Controller as ControllerComponent,
} from 'src/react-native/component';
import {
  useScreen,
  useReplaceTo,
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
import GestureRecognizer from 'react-native-swipe-gestures';

const useCardSwipe = (direction: SwipeDirection) => {
  const deck = useCurrentDeck();
  return useThunkAction(action.deckSwipe(direction, deck.id));
};

export const Controller = (props: { deckId: string }) => {
  const dispatch = useDispatch();
  const deck = useDeck(props.deckId);
  const [currentIndex, setIndex] = React.useState(deck.currentIndex);

  const callback = () => setIndex(deck.currentIndex + 1);
  const ref = React.useRef(callback);

  React.useEffect(() => {
    currentIndex !== deck.currentIndex &&
      dispatch(action.deckUpdate({ id: deck.id, currentIndex }));
    const c =
      currentIndex >= deck.cardOrderIds.length
        ? { autoPlay: false }
        : { showBackText: false };
    dispatch(action.type.configUpdate(c));
  }, [currentIndex]);

  React.useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const autoPlay = useConfigAttr('autoPlay');
  const interval = useConfigAttr('cardInterval');

  React.useEffect(() => {
    const f = setTimeout(() => {
      if (autoPlay) {
        ref.current();
      }
    }, interval * 1000);
    return () => {
      clearInterval(f);
    };
  }, [autoPlay, deck.currentIndex]);

  React.useEffect(() => {
    return () => {
      if (autoPlay) dispatch(action.type.configUpdate({ autoPlay: false }));
    };
  }, [autoPlay]);

  return (
    <ControllerComponent
      pause={useConfigAttr('autoPlay')}
      onPlay={() => dispatch(action.configToggle('autoPlay'))}
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
  const category = card.tags.length > 0 ? card.tags[0] : deck.category;
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
  return (
    <GestureRecognizer
      style={{ flex: 1 }}
      onSwipeLeft={useCardSwipe('cardSwipeLeft')}
      onSwipeUp={useCardSwipe('cardSwipeUp')}
      onSwipeRight={useCardSwipe('cardSwipeRight')}
      onSwipeDown={useCardSwipe('cardSwipeDown')}
    >
      <CardView frontText cardId={deck.cardOrderIds[deck.currentIndex]} />
    </GestureRecognizer>
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

const FrontHeader = () => {
  const replaceTo = useReplaceTo();
  const goTo = useGoTo();
  const deck = useCurrentDeck();
  const cardId = deck.cardOrderIds[deck.currentIndex];
  if (!useConfigAttr('showHeader')) return <NB.View />;
  return (
    <Header
      bodyText={deck.name}
      bodyOnPress={React.useCallback(
        () => replaceTo('CardList', { deckId: deck.id }),
        [deck.id]
      )}
      rightIcon="edit"
      rightOnPress={React.useCallback(() => goTo('CardEdit', { cardId }), [
        cardId,
      ])}
    />
  );
};

const SwipeButtonList = () => {
  const label = {
    cardSwipeLeft: '←',
    cardSwipeDown: '↓',
    cardSwipeUp: '↑',
    cardSwipeRight: '→',
  };
  const swipe = {
    cardSwipeLeft: useCardSwipe('cardSwipeLeft'),
    cardSwipeDown: useCardSwipe('cardSwipeDown'),
    cardSwipeUp: useCardSwipe('cardSwipeUp'),
    cardSwipeRight: useCardSwipe('cardSwipeRight'),
  };
  const reset = useConfigUpdateInAdvance({ lastSwipe: undefined });
  const lastSwipe = useConfigAttr('lastSwipe');
  React.useEffect(() => {
    lastSwipe && setTimeout(() => reset(), 500);
  }, [lastSwipe]);

  return (
    <NB.View>
      <NB.View style={{ flexDirection: 'row' }}>
        {[
          'cardSwipeLeft',
          'cardSwipeDown',
          'cardSwipeUp',
          'cardSwipeRight',
        ].map(key => (
          <RN.TouchableOpacity
            key={key}
            style={{
              flex: 1,
              alignContent: 'center',
              alignItems: 'center',
              backgroundColor: key === lastSwipe ? '#eee' : undefined,
            }}
            onPress={swipe[key]}
          >
            <NB.Text style={{ fontSize: 50 }}>{label[key]}</NB.Text>
          </RN.TouchableOpacity>
        ))}
      </NB.View>
    </NB.View>
  );
};

const FrontText = () => {
  const deck = useCurrentDeck();
  const showSwipeButtonList = useConfigAttr('showSwipeButtonList');
  const showBackText = useConfigAttr('showBackText');
  const cardId = deck.cardOrderIds[deck.currentIndex];
  const interval = useConfigAttr('cardInterval');
  return (
    <NB.View style={{ flex: 1, display: showBackText ? 'none' : undefined }}>
      <FrontHeader />
      <NB.View style={{ flex: 1 }}>
        <Overlay top>
          <Badge text={String(useCardAttr(cardId, 'score') || 0)} />
        </Overlay>
        <DeckSwiper deckId={deck.id} />
        <NB.View>
          {showSwipeButtonList && <SwipeButtonList />}
          {interval > 0 && <Controller deckId={deck.id} />}
        </NB.View>
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
      // you should not use action.type.deckUpdate here
      // because firebase server returns currentIndex too
      // so when deck attr changed, currentIndex will be changed too
      dispatch(action.deckUpdate({ id: deck.id, currentIndex: 0 }));
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
