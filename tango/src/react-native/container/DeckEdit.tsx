import * as React from "react";
import * as NB from "native-base";
import { useSelector, useDispatch } from "react-redux";
import * as C from "src/constant";
import {
  TextItem,
  SwithItem,
  PickerItem,
  InputItem,
} from "src/react-native/component";
import { useDeckEdit } from "src/react-native/hooks/action";
import { useCurrentDeck } from "src/hooks/state";
import { useGoTo } from "src/react-native/hooks/action";
import { Header } from "./Common";
import * as action from "src/react-native/action";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

function useEdit<T extends keyof Deck>(key: T) {
  return useSelector((state: RootState) => state.deck.edit[key]);
}

const IDItem = React.memo(() => {
  const v = useEdit("id");
  return <TextItem noBorder left="ID" body={v} />;
});

const UIDItem = React.memo(() => {
  const v = useEdit("uid");
  return <TextItem noBorder left="UID" body={v} />;
});

const URLItem = React.memo(() => {
  const v = useEdit("url") ?? "";
  return <TextItem noBorder left="URL" body={v} />;
});

const SheetIDItem = React.memo(() => {
  const v = useEdit("sheetId") ?? "";
  return <TextItem noBorder left="Sheet ID" body={v} />;
});

const NumberOfCardsItem = React.memo(() => {
  const v = useEdit("cardIds") || [];
  return <TextItem noBorder left="Number Of Cards" body={String(v.length)} />;
});

const NameItem = React.memo(() => {
  const v = useEdit("name");
  const deckEdit = useDeckEdit();
  return (
    <InputItem
      noBorder
      value={v}
      left="Name"
      onChangeText={(name) => deckEdit({ name })}
    />
  );
});

const PublicItem = React.memo(() => {
  const v = useEdit("isPublic");
  const deckEdit = useDeckEdit();
  return (
    <SwithItem
      noBorder
      left="Public"
      value={v}
      onValueChange={(isPublic) => deckEdit({ isPublic })}
    />
  );
});

const ConvertToBrItem = React.memo(() => {
  const v = useEdit("convertToBr");
  const deckEdit = useDeckEdit();
  return (
    <SwithItem
      noBorder
      left={`Convert two \n to <br/> tag`}
      value={v}
      onValueChange={(convertToBr) => deckEdit({ convertToBr })}
    />
  );
});

const OnlyBodyConverted = React.memo(() => {
  const v = useEdit("onlyBodyinWebview");
  const deckEdit = useDeckEdit();
  return (
    <SwithItem
      noBorder
      left="Only body converted"
      value={v}
      onValueChange={(onlyBodyinWebview) => deckEdit({ onlyBodyinWebview })}
    />
  );
});

const CategoryItem = React.memo(() => {
  const v = useEdit("category");
  const deckEdit = useDeckEdit();
  return (
    <PickerItem
      empty
      label="Category"
      value={v}
      options={C.CATEGORY}
      onValueChange={(category) => deckEdit({ category })}
    />
  );
});

export const DeckEdit = React.memo(() => (
  <NB.List>
    <IDItem />
    <UIDItem />
    <URLItem />
    <NameItem />
    <NumberOfCardsItem />
    <SheetIDItem />
    <PublicItem />
    <ConvertToBrItem />
    <OnlyBodyConverted />
    <CategoryItem />
  </NB.List>
));

export const PageHeader = React.memo((props: { name: string }) => {
  const navi = useNavigation();
  const dispatch = useDispatch();
  const onPress = React.useCallback(() => {
    dispatch(action.deckEditUpdate());
    navi.navigate("DeckList");
  }, []);
  return <Header bodyText={props.name} right={{ icon: "save", onPress }} />;
});

export const DeckEditPage = React.memo(() => {
  const route = useRoute<RouteProp<RouteParamList, "Deck">>();
  const { deckId } = route.params;
  const deck = useCurrentDeck(deckId);
  const deckEdit = useDeckEdit();
  React.useEffect(() => {
    deckEdit(deck);
  }, []);
  return (
    <NB.Container>
      <PageHeader name={deck.name} />
      <NB.Content>
        <DeckEdit />
      </NB.Content>
    </NB.Container>
  );
});
