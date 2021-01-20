import * as React from "react";
import * as NB from "native-base";
import { useSelector } from "react-redux";
import { TextItem, Button, Field, Separator } from "src/react-native/component";
import { useCurrentCard } from "src/hooks/state";
import { useCardEdit } from "src/react-native/hooks/action";
import { Header } from "./Header";
import * as action from "src/react-native/action";
import { useDispatch } from "src/hooks";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

function useEdit<T extends keyof Card>(key: T) {
  return useSelector((state) => state.card.edit[key]);
}

const IDItem = () => {
  const v = useEdit("id");
  return <TextItem noBorder body="ID" right={v} />;
};

const ScoreItem = () => {
  const v = useEdit("score");
  return <TextItem noBorder body="Score" right={String(v)} />;
};

const TagsItem = () => {
  const v = useEdit("tags") || [];
  return <TextItem noBorder body="Tags" right={v.join(", ")} />;
};

const NextSeeingAtItem = () => {
  const v = useEdit("nextSeeingAt");
  return <TextItem noBorder body="Next time" right={String(v)} />;
};

const LastSeenAtItem = () => {
  const v = useEdit("lastSeenAt");
  return <TextItem noBorder body="Last Seen" right={String(v)} />;
};

const DeleteCard = () => {
  // const id = useEdit('id');
  return (
    <Button
      danger
      full
      text="DELETE"
      onPress={() => alert("sorry but not implemented yet")}
    // onPress={useThunkAction(action.cardDelete(id))}
    />
  );
};

const FrontTextField = () => {
  const v = useEdit("frontText");
  const cardEdit = useCardEdit();
  return (
    <Field
      name="Front Text"
      value={v}
      onChangeText={(frontText) => cardEdit({ frontText })}
    />
  );
};
const BackTextField = () => {
  const v = useEdit("backText");
  const cardEdit = useCardEdit();
  return (
    <Field
      name="Back Text"
      value={v}
      onChangeText={(backText) => cardEdit({ backText })}
    />
  );
};

export const CardEdit = () => (
  <>
    <NB.List>
      <Separator />
      <IDItem />
      <ScoreItem />
      <TagsItem />
      <NextSeeingAtItem />
      <LastSeenAtItem />
    </NB.List>
    <NB.Form>
      <FrontTextField />
      <BackTextField />
    </NB.Form>
    <DeleteCard />
  </>
);

export const CardEditPage = () => {
  const route = useRoute<RouteProp<RouteParamList, "Card">>();
  const { cardId } = route.params;
  const dispatch = useDispatch();
  const navi = useNavigation();
  const card = useCurrentCard(cardId);
  const cardEdit = useCardEdit();
  React.useEffect(() => {
    cardEdit(card);
  }, []);
  return (
    <NB.Container>
      <Header
        body={{ title: "" }}
        right={{
          icon: "save",
          onPress: React.useCallback(() => {
            dispatch(action.cardEditUpdate());
            navi.goBack();
          }, []),
        }}
      />
      <NB.Content>
        <CardEdit />
        <NB.Footer />
      </NB.Content>
    </NB.Container>
  );
};
