import * as React from "react";
import * as NB from "native-base";
import { IconItem } from "src/react-native/component";
import { Header } from "./Header";
import { useNavigation } from "@react-navigation/native";

const DeckPublicItem = React.memo(() => {
  const navi = useNavigation();
  return (
    <IconItem
      awsomeFont
      name="angle-right"
      body="Import From Public Deck List"
      onPress={() => navi.navigate("DeckPublicList")}
      onPressItem={() => navi.navigate("DeckPublicList")}
    />
  );
});

const SpreadSheetItem = React.memo(() => {
  const navi = useNavigation();
  return (
    <IconItem
      awsomeFont
      name="angle-right"
      body="Import From Google Spread Sheet"
      onPress={() => navi.navigate("SpreadSheetList")}
      onPressItem={() => navi.navigate("SpreadSheetList")}
    />
  );
});

const QRCodeItem = React.memo(() => {
  const navi = useNavigation();
  return (
    <IconItem
      awsomeFont
      name="angle-right"
      body="Import From CSV URL by QR code"
      onPress={() => navi.navigate("QRCode")}
      onPressItem={() => navi.navigate("QRCode")}
    />
  );
});

export const DownloadPage = () => (
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
