import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import { IconItem } from "src/react-native/component";
import { useIsLoading } from "src/react-native/hooks/action";
import { useSelector, useConfigAttr } from "src/hooks/state";
import { Header } from "./Common";
import * as action from "src/react-native/action";
import { useThunkAction } from "src/hooks";

const Item = (props: { item: Deck }) => {
  const item = props.item;
  const deckImport = useThunkAction(action.deckPublicImport(item.id));
  const isLoading = useConfigAttr("isLoading");
  const { setLoading, unsetLoading } = useIsLoading();
  const onPress = React.useCallback(async () => {
    if (isLoading) return;
    await setLoading();
    await deckImport();
    await unsetLoading();
  }, [isLoading]);
  return (
    <IconItem
      awsomeFont
      name="download"
      body={`${item.name}`}
      onPressItem={onPress}
      onPress={onPress}
    />
  );
};

const DeckPublicList = () => {
  const fetch = useThunkAction(action.deckPubicFetch());
  const decks = useSelector((state) => state.download.publicDecks);
  const { setLoading, unsetLoading } = useIsLoading();
  React.useEffect(() => {
    (async () => {
      await setLoading();
      await fetch();
      await unsetLoading();
    })();
  }, []);
  return (
    <RN.FlatList
      data={decks}
      keyExtractor={(sheet) => sheet.id}
      ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
      renderItem={({ item }: { item: Deck }) => <Item item={item} />}
    />
  );
};

// Don't wrap <RN.FlatList> with <NB.Content />
export const DeckPublicListPage = () => {
  return (
    <NB.Container>
      <Header bodyText="Public Deck List" />
      <DeckPublicList />
    </NB.Container >
  );
};
