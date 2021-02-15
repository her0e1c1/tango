import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import { IconItem } from "src/react-native/component";
import { useSelector } from "src/hooks/state";
import { Header } from "./Common";
import * as action from "src/react-native/action";
import { useThunkAction } from "src/hooks";

const Item = (props: { item: Deck }) => {
  const [loading, setLoading] = React.useState(false);
  const item = props.item;
  const deckImport = useThunkAction(action.deckPublicImport(item.id));
  const onPress = React.useCallback(async () => {
    await setLoading(true);
    await deckImport();
    await setLoading(false);
  }, []);
  return (
    <IconItem
      awsomeFont
      name="cloud-download"
      body={`${item.name}`}
      loading={loading}
      onPressItem={onPress}
      onPress={onPress}
    />
  );
};

const DeckPublicList = () => {
  const fetch = useThunkAction(action.deckPubicFetch());
  const decks = useSelector((state) => state.download.publicDecks);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await fetch();
      setLoading(false);
    })();
  }, []);
  return loading ? <NB.Spinner color="silver" /> :
    (
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
    </NB.Container>
  );
};
