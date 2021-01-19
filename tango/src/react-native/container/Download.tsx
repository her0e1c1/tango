import * as React from "react";
import * as NB from "native-base";
import { IconItem } from "src/react-native/component";
import { useGoTo } from "src/react-native/hooks/action";
import { Header } from "./Common";
import { useNavigation } from "@react-navigation/native";

const DeckPublicItem = React.memo(() => {
  const navi = useNavigation();
  return (
    <IconItem
      awsomeFont
      name="chevron-right"
      body="Import From Public Deck List"
      onPress={() => navi.navigate("DeckPublicList")}
      // onPressItem={() => navi.navigate("Download", { screen: "DeckPublicList" })}
    />
  );
});

const SpreadSheetItem = React.memo(() => {
  const goTo = useGoTo();
  return (
    <IconItem
      awsomeFont
      name="chevron-right"
      body="Import From Google Spread Sheet"
      onPress={() => goTo("SpreadSheetList")}
      onPressItem={() => goTo("SpreadSheetList")}
    />
  );
});

const QRCodeItem = React.memo(() => {
  const goTo = useGoTo();
  const navi = useNavigation();
  return (
    <IconItem
      awsomeFont
      name="chevron-right"
      body="Import From CSV URL by QR code"
      onPress={() => navi.navigate("Download", { screen: "QRCode" })}
      // onPressItem={() => goTo('QRCode')}
    />
  );
});

export const DownloadPage = () => {
  return (
    <NB.Container>
      <Header bodyText="Download" />
      <NB.Content>
        <NB.List>
          <DeckPublicItem />
          <SpreadSheetItem />
          <QRCodeItem />
        </NB.List>
      </NB.Content>
    </NB.Container>
  );
};