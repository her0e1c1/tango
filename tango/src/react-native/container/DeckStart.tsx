import * as React from "react";
import * as NB from "native-base";
import {
  Button,
  Separator,
  ButtonItem,
  SliderItem,
  RadioItem,
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
    return (
      <>
        <Separator text="filter by tags" />
        <ButtonItem
          title="ALL"
          onPress={useThunkAction(
            action.deckUpdate({ id: props.deckId, selectedTags: tags })
          )}
        />
        <ButtonItem
          title="CLEAR"
          onPress={useThunkAction(
            action.deckUpdate({ id: props.deckId, selectedTags: [] })
          )}
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

const MaxScoreItems = React.memo(
  (props: { scoreMax: number | null; deckId: string }) => {
    const dispatch = useDispatch();
    const [score, setScore] = React.useState(props.scoreMax || 0);
    return (
      <>
        <Separator text={`max score ${props.scoreMax != null ? score : ""}`} />
        <ButtonItem
          title="disable"
          onPress={useThunkAction(
            action.deckUpdate({ id: props.deckId, scoreMax: null })
          )}
        />
        <SliderItem
          icon
          // disabled={props.scoreMax != null}
          max={10}
          min={-10}
          value={score}
          onValueChange={setScore}
          onSlidingComplete={(score) =>
            dispatch(action.deckUpdate({ id: props.deckId, scoreMax: score }))
          }
        />
      </>
    );
  }
);

const MinScoreItems = React.memo(
  (props: { scoreMin: number | null; deckId: string }) => {
    const dispatch = useDispatch();
    const [score, setScore] = React.useState(props.scoreMin || 0);
    return (
      <>
        <Separator text={`min score ${props.scoreMin != null ? score : ""}`} />
        <ButtonItem
          title="disable"
          onPress={useThunkAction(
            action.deckUpdate({ id: props.deckId, scoreMin: null })
          )}
        />
        <SliderItem
          icon
          max={10}
          min={-10}
          value={score}
          onValueChange={setScore}
          onSlidingComplete={(score) =>
            dispatch(action.deckUpdate({ id: props.deckId, scoreMin: score }))
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
        <NB.View style={{ margin: 10 }} />
        <StartButton length={cards.length} deckId={deck.id} />
        <NB.List>
          <MaxScoreItems deckId={deck.id} scoreMax={deck.scoreMax} />
          <MinScoreItems deckId={deck.id} scoreMin={deck.scoreMin} />
          <FilterByTagItems deckId={deck.id} selectedTags={deck.selectedTags} />
        </NB.List>
      </NB.Content>
    </NB.Container>
  );
});
