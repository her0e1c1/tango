import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import * as C from "src/constant";
import {
  TextCard,
  WebviewCard,
  Overlay,
  Controller as ControllerComponent,
} from "src/react-native/component";
import {
  useReplaceTo,
  useGoTo,
  useConfigUpdateInAdvance,
} from "src/react-native/hooks/action";
import {
  useDeck,
  useCard,
  useConfigAttr,
  useCurrentDeck,
  useCardAttr,
} from "src/hooks/state";
import { Header } from "./Common";
import { useThunkAction, useDispatch } from "src/hooks";
import * as action from "src/react-native/action";
import GestureRecognizer from "react-native-swipe-gestures";
import { useKeepAwake } from "expo-keep-awake";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";

const useCardSwipe = (direction: SwipeDirection, deckId: string) => {
  return useThunkAction(action.deckSwipe(direction, deckId));
};

export const Controller = (props: { deckId: string; hide?: boolean }) => {
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

  const autoPlay = useConfigAttr("autoPlay");
  const interval = useConfigAttr("cardInterval");

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

  // HOTFIX: on android, slider is displayed even in backText page
  const pause = useConfigAttr("autoPlay");
  const onPlay = () => dispatch(action.configToggle("autoPlay"));
  if (props.hide) {
    return <NB.View />;
  }
  return (
    <ControllerComponent
      pause={pause}
      onPlay={onPlay}
      cardsLength={deck.cardOrderIds.length}
      deckCurrentIndex={deck.currentIndex}
      onSlidingComplete={setIndex}
    />
  );
};

const getCagegory = (category: string, tags: string[]) => {
  tags = tags
    .map((tag) => (tag in C.MAPPING ? C.MAPPING[tag] : tag))
    .filter((tag) => C.CATEGORY.includes(tag));
  if (tags.length > 0) {
    return tags[0];
  }
  return category;
};

export const CardView = (props: {
  frontText: boolean;
  cardId: string;
  deckId: string;
}) => {
  const ref = React.useRef<RN.WebView>(null);
  const deck = useCurrentDeck(props.deckId);
  const showBackText = useConfigUpdateInAdvance({
    showBackText: true,
    keepBackTextViewed: false,
  });
  const showBackTextLong = useConfigUpdateInAdvance({
    showBackText: true,
    keepBackTextViewed: true,
  });
  const card = useCard(props.cardId);
  const category = getCagegory(deck.category, card.tags);
  const text = props.frontText ? card.frontText : card.backText;
  React.useEffect(() => {
    category &&
      ref.current &&
      ref.current.postMessage(JSON.stringify({ text, category }));
  }, [category, text]);
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
      onSwipeLeft={useCardSwipe("cardSwipeLeft", props.deckId)}
      onSwipeUp={useCardSwipe("cardSwipeUp", props.deckId)}
      onSwipeRight={useCardSwipe("cardSwipeRight", props.deckId)}
      onSwipeDown={useCardSwipe("cardSwipeDown", props.deckId)}
    >
      <CardView
        frontText
        cardId={deck.cardOrderIds[deck.currentIndex]}
        deckId={props.deckId}
      />
    </GestureRecognizer>
  );
};

const BackText: React.FC<{ deckId: string }> = (props) => {
  const deck = useCurrentDeck(props.deckId);
  const showBackText = useConfigAttr("showBackText");
  const hideBackText = useConfigUpdateInAdvance({
    showBackText: false,
    keepBackTextViewed: false,
  });
  const cardId = deck.cardOrderIds[deck.currentIndex];
  return (
    <NB.View
      style={{
        flex: 1,
        display: showBackText ? undefined : "none",
        backgroundColor: "white",
      }}
    >
      <Overlay top onPress={useCardSwipe("cardSwipeUp", props.deckId)} />
      <Overlay left onPress={useCardSwipe("cardSwipeLeft", props.deckId)} />
      <Overlay right onPress={useCardSwipe("cardSwipeRight", props.deckId)} />
      <Overlay
        bottom
        onPress={hideBackText}
        color="rgba(52, 52, 52, 0.1)'"
        onLongPress={useCardSwipe("cardSwipeDown", props.deckId)}
      />
      <CardView frontText={false} cardId={cardId} deckId={props.deckId} />
    </NB.View>
  );
};

const FrontHeader: React.FC<{ deckId: string }> = (props) => {
  const replaceTo = useReplaceTo();
  const goTo = useGoTo();
  const deck = useCurrentDeck(props.deckId);
  const cardId = deck.cardOrderIds[deck.currentIndex];
  if (!useConfigAttr("showHeader")) return <NB.View />;
  return (
    <Header
      bodyText={deck.name}
      bodyOnPress={React.useCallback(
        () => replaceTo("CardList", { deckId: deck.id }),
        [deck.id]
      )}
      rightIcon="edit"
      rightOnPress={React.useCallback(() => goTo("CardEdit", { cardId }), [
        cardId,
      ])}
    />
  );
};

const SwipeButtonList: React.FC<{ deckId: string }> = (props) => {
  const label = {
    cardSwipeLeft: "←",
    cardSwipeDown: "↓",
    cardSwipeUp: "↑",
    cardSwipeRight: "→",
  };
  const swipe = {
    cardSwipeLeft: useCardSwipe("cardSwipeLeft", props.deckId),
    cardSwipeDown: useCardSwipe("cardSwipeDown", props.deckId),
    cardSwipeUp: useCardSwipe("cardSwipeUp", props.deckId),
    cardSwipeRight: useCardSwipe("cardSwipeRight", props.deckId),
  };
  const reset = useConfigUpdateInAdvance({ lastSwipe: undefined });
  const lastSwipe = useConfigAttr("lastSwipe");
  React.useEffect(() => {
    lastSwipe && setTimeout(() => reset(), 500);
  }, [lastSwipe]);

  return (
    <NB.View>
      <NB.View style={{ flexDirection: "row" }}>
        {[
          "cardSwipeLeft",
          "cardSwipeDown",
          "cardSwipeUp",
          "cardSwipeRight",
        ].map((key) => (
          <RN.TouchableOpacity
            key={key}
            style={{
              flex: 1,
              alignContent: "center",
              alignItems: "center",
              backgroundColor: key === lastSwipe ? "#eee" : undefined,
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

const TimePicker = ({ cardId }: { cardId: string }) => {
  const dispatch = useDispatch();
  const interval = useCardAttr(cardId, "interval");
  return (
    <NB.Picker
      selectedValue={String(interval)}
      onValueChange={(interval) => {
        dispatch(action.cardUpdate({ id: cardId, interval: Number(interval) }));
      }}
    >
      {Object.entries(C.NEXT_SEEING_MINUTES).map(([value, label]) => (
        <NB.Picker.Item key={value} label={label} value={value} />
      ))}
    </NB.Picker>
  );
};

const FrontText: React.FC<{ deckId: string }> = (props) => {
  const dispatch = useDispatch();
  const deck = useCurrentDeck(props.deckId);
  const showBackText = useConfigAttr("showBackText");
  const cardId = deck.cardOrderIds[deck.currentIndex];
  const defaultScore = useCardAttr(cardId, "score") || 0;
  const [showSlider, setShowSlider] = React.useState(false);
  const [score, setScore] = React.useState(defaultScore);
  return (
    <NB.View
      style={{
        flex: 1,
        display: showBackText ? "none" : undefined,
        backgroundColor: "white",
      }}
    >
      <FrontHeader deckId={props.deckId} />
      <NB.View style={{ flex: 1 }}>
        <Overlay
          top
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <NB.Button rounded onPress={() => setShowSlider(true)}>
            <NB.Text>{String(score)}</NB.Text>
          </NB.Button>
          {showSlider && (
            <RN.Slider
              style={{ marginHorizontal: 5, flex: 1 }}
              minimumValue={-10}
              maximumValue={10}
              step={1}
              value={score}
              onValueChange={setScore}
              onSlidingComplete={(score) => {
                dispatch(action.cardUpdate({ id: cardId, score }));
                setShowSlider(false);
              }}
            />
          )}
          {!showSlider && <TimePicker cardId={cardId} />}
        </Overlay>
        <DeckSwiper deckId={deck.id} />
        <NB.View>
          {useConfigAttr("showSwipeButtonList") && (
            <SwipeButtonList deckId={props.deckId} />
          )}
          {useConfigAttr("cardInterval") > 0 && (
            <Controller deckId={deck.id} hide={showBackText} />
          )}
        </NB.View>
      </NB.View>
    </NB.View>
  );
};

export const DeckSwiperPage = () => {
  useKeepAwake();
  const navi = useNavigation();
  const route = useRoute<RouteProp<RouteParamList, "DeckSwiper">>();
  const { deckId } = route.params;
  const dispatch = useDispatch();
  const deck = useCurrentDeck(deckId);
  const index = deck.currentIndex;
  const valid = 0 <= index && index < deck.cardOrderIds.length;
  React.useEffect(() => {
    if (!valid) {
      // you should not use action.type.deckUpdate here
      // because firebase server returns currentIndex too
      // so when deck attr changed, currentIndex will be changed too
      dispatch(action.deckUpdate({ id: deck.id, currentIndex: 0 }));
      navi.goBack();
    }
  }, [valid]);
  if (!valid) return <NB.Container />;
  return (
    <NB.Container>
      <BackText deckId={deckId} />
      <FrontText deckId={deckId} />
    </NB.Container>
  );
};
