import * as React from 'react';
import * as NB from 'native-base';
import { IconItem, createDownloadNavi } from 'src/react-native/component';
import { useGoTo } from 'src/react-native/hooks/action';
import { Header } from './Common';
import { SpreadSheetListPage } from './SpreadSheetList';
import { QRCodePage } from './QRcode';

const SpreadSheetItem = React.memo(() => {
  const goTo = useGoTo();
  return (
    <IconItem
      awsomeFont
      name="chevron-right"
      body="Import From Google Spread Sheet"
      onPress={() => goTo('SpreadSheetList')}
      onPressItem={() => goTo('SpreadSheetList')}
    />
  );
});

const QRCodeItem = React.memo(() => {
  const goTo = useGoTo();
  return (
    <IconItem
      awsomeFont
      name="chevron-right"
      body="Import From CSV URL by QR code"
      onPress={() => goTo('QRCode')}
      onPressItem={() => goTo('QRCode')}
    />
  );
});

export const Download = () => {
  return (
    <NB.Container>
      <Header bodyText="Download" />
      <NB.Content>
        <NB.List>
          <SpreadSheetItem />
          <QRCodeItem />
        </NB.List>
      </NB.Content>
    </NB.Container>
  );
};

export const DownloadPage = createDownloadNavi({
  Download,
  SpreadSheetList: SpreadSheetListPage,
  QRCode: QRCodePage,
});
