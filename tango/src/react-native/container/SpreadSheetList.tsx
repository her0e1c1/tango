import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import { IconItem } from "src/react-native/component";
import { useIsLoading } from "src/react-native/hooks/action";
import { useSelector, useConfigAttr } from "src/hooks/state";
import { Header } from "./Common";
import * as action from "src/react-native/action";
import { useThunkAction } from "src/hooks";
import { useNavigation } from "@react-navigation/native";

const Sheet = (props: { item: Sheet }) => {
  const [loading, setLoading] = React.useState(false);
  const item = props.item;
  const sheetImport = useThunkAction(action.sheetImport(item.id));
  const onPress = React.useCallback(async () => {
    await setLoading(true);
    await sheetImport();
    await setLoading(false);
  }, []);
  return (
    <IconItem
      awsomeFont
      name="cloud-download"
      body={`${item.title} (${item.name})`}
      loading={loading}
      onPressItem={onPress}
      onPress={onPress}
    />
  );
};

export const SpreadSheetList = () => {
  const uid = useConfigAttr("uid");
  const navi = useNavigation();
  const sheetFetch = useThunkAction(action.sheetFetch());
  const byId = useSelector((state) => state.download.sheetById);
  const sheets = Object.values(byId) as Sheet[];
  const { setLoading, unsetLoading } = useIsLoading();
  React.useEffect(() => {
    (async () => {
      if (uid) {
        await setLoading();
        await sheetFetch();
        await unsetLoading();
      } else {
        alert("You need to login with Google account");
        navi.goBack();
      }
    })();
  }, []);
  return (
    <RN.FlatList
      data={sheets}
      keyExtractor={(sheet) => sheet.id}
      ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
      renderItem={({ item }: { item: Sheet }) => <Sheet item={item} />}
    />
  );
};

// Don't wrap <RN.FlatList> with <NB.Content />
export const SpreadSheetListPage = () => {
  return (
    <NB.Container>
      <Header bodyText="Spread Sheets" />
      <SpreadSheetList />
    </NB.Container>
  );
};
