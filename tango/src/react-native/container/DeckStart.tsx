import * as React from "react";
import * as NB from "native-base";
import {
  Button,
  Separator,
  SliderItem,
  RadioItem,
  SwithItem,
  ButtonsItem,
} from "src/react-native/component";
import {
  useCurrentDeck,
  useCardsByDeckId,
  useConfigAttr,
} from "src/hooks/state";
import { Header } from "./Common";
import { uniq } from "lodash";
import { useThunkAction, useDispatch } from "src/hooks";
import * as action from "src/react-native/action";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { StackActions } from "@react-navigation/native";

const getTags = (cards: Card[]) => {
  return uniq(cards.map((c) => c.tags).reduce((a, acc) => [...a, ...acc], []));
};

const updateTags = (tags: string[], tag: string) => {
  if (tags.includes(tag)) {
    return tags.filter((t) => t != tag);
  } else {
    return [...tags, tag];
  }
};

const StartButton = React.memo((props: { length: number; deckId: string }) => {
  const dispatch = useDispatch();
  const navi = useNavigation();
  const cards = useCardsByDeckId(props.deckId, { isShown: true });
  const maxNumberOfCardsToLearn = useConfigAttr("maxNumberOfCardsToLearn");
  let number = props.length;
  if (maxNumberOfCardsToLearn > 0) {
    number = Math.min(number, maxNumberOfCardsToLearn);
  }
  return (
    <Button
      info
      full
      text={`Start to learn ${number} out of ${props.length} card(s) `}
      onPress={async () => {
        if (number > 0) {
          await dispatch(action.deckStart(cards));
          await navi.dispatch(
            StackActions.replace("DeckSwiper", { deckId: props.deckId })
          );
        } else {
          alert("No cards to learn");
        }
      }}
    />
  );
});

const FilterByTagItems = React.memo(
  (props: { deckId: string; selectedTags: string[] }) => {
    const dispatch = useDispatch();
    const allcards = useCardsByDeckId(props.deckId);
    const tags = getTags(allcards);
    if (tags.length === 0) {
      return <></>;
    }
    return (
      <>
        <Separator text="Tags" />
        <ButtonsItem
          alignRight
          buttons={[
            {
              title: "All",
              onPress: useThunkAction(
                action.deckUpdate({ id: props.deckId, selectedTags: tags })
              ),
            },
            {
              title: "Clear",
              onPress: useThunkAction(
                action.deckUpdate({ id: props.deckId, selectedTags: [] })
              ),
            },
          ]}
        />
        {tags.map((tag, key) => (
          <RadioItem
            key={key}
            body={tag}
            selected={props.selectedTags.includes(tag)}
            onPressItem={() =>
              dispatch(
                action.deckUpdate({
                  id: props.deckId,
                  selectedTags: updateTags(props.selectedTags, tag),
                })
              )
            }
          />
        ))}
      </>
    );
  }
);

const scoreText = (max: number | null, min: number | null): string => {
  if (max != null && min != null) {
    return `${min}~${max}`;
  } else if (min != null) {
    return `${min}~`;
  } else if (max != null) {
    return `~${max}`;
  } else {
    return "";
  }
};

const ScoreItems = React.memo(
  (props: {
    scoreMax: number | null;
    scoreMin: number | null;
    deckId: string;
  }) => {
    const dispatch = useDispatch();
    const [scoreMin, setMinScore] = React.useState(props.scoreMin);
    const [scoreMax, setMaxScore] = React.useState(props.scoreMax);
    const [maxScoreEnabled, makeMaxScoreEnabled] = React.useState(
      props.scoreMax != null
    );
    const [minScoreEnabled, makeMinScoreEnabled] = React.useState(
      props.scoreMin != null
    );
    const onMaxValueChange = async () => {
      if (maxScoreEnabled) {
        await dispatch(action.deckUpdate({ id: props.deckId, scoreMax: null }));
        setMaxScore(null);
        makeMaxScoreEnabled(false);
      } else {
        await dispatch(action.deckUpdate({ id: props.deckId, scoreMax: 0 }));
        setMaxScore(0);
        makeMaxScoreEnabled(true);
      }
    };
    const onMinValueChange = async () => {
      if (minScoreEnabled) {
        await dispatch(action.deckUpdate({ id: props.deckId, scoreMin: null }));
        setMinScore(null);
        makeMinScoreEnabled(false);
      } else {
        await dispatch(action.deckUpdate({ id: props.deckId, scoreMin: 0 }));
        setMinScore(0);
        makeMinScoreEnabled(true);
      }
    };
    return (
      <>
        <Separator text={`Score ${scoreText(scoreMax, scoreMin)}`} />
        <SwithItem
          icon
          body="Filter by max"
          value={maxScoreEnabled}
          onValueChange={onMaxValueChange}
        />
        <SliderItem
          icon
          max={10}
          min={-10}
          disabled={!maxScoreEnabled}
          value={scoreMax}
          onValueChange={setMaxScore}
          onSlidingComplete={(scoreMax) =>
            dispatch(action.deckUpdate({ id: props.deckId, scoreMax }))
          }
        />
        <SwithItem
          icon
          body="Filter by min"
          value={minScoreEnabled}
          onValueChange={onMinValueChange}
        />
        <SliderItem
          icon
          max={10}
          min={-10}
          disabled={!minScoreEnabled}
          value={scoreMin}
          onValueChange={setMinScore}
          onSlidingComplete={(scoreMin) =>
            dispatch(action.deckUpdate({ id: props.deckId, scoreMin }))
          }
        />
      </>
    );
  }
);

export const DeckStartPage = React.memo(() => {
  const route = useRoute<RouteProp<RouteParamList, "DeckStart">>();
  const { deckId } = route.params;
  const deck = useCurrentDeck(deckId);
  const cards = useCardsByDeckId(deck.id, { isShown: true });
  return (
    <NB.Container>
      <Header body={{ title: "Deck Start" }} />
      <NB.Content>
        <NB.View style={{ margin: 5 }} />
        <StartButton length={cards.length} deckId={deck.id} />
        <NB.List>
          <ScoreItems
            deckId={deck.id}
            scoreMax={deck.scoreMax}
            scoreMin={deck.scoreMin}
          />
          <FilterByTagItems deckId={deck.id} selectedTags={deck.selectedTags} />
        </NB.List>
      </NB.Content>
    </NB.Container>
  );
});
