import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import { useIsLoading } from 'src/react-native/hooks/action';
import { Header } from './Common';
import * as action from 'src/react-native/action';
import { useDispatch } from 'react-redux';

const CodeScanner = (props: { onEnd: Callback }) => {
  const [hasPermission, setHasPermission] = React.useState(false);
  React.useEffect(() => {
    Permissions.askAsync(Permissions.CAMERA).then(res => {
      if (res.status === 'granted') {
        setHasPermission(true);
      } else {
        alert('No access to camera');
        props.onEnd();
      }
    });
  }, [hasPermission]);

  const dispatch = useDispatch();
  const { withLoading } = useIsLoading();
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    if (!text) return;
    withLoading(async () => {
      await dispatch(action.importByURL(text));
      props.onEnd();
    });
  }, [text]);

  return (
    <NB.View style={{ flex: 1, backgroundColor: 'pink' }}>
      <BarCodeScanner
        // the callback invoke is too sensitive
        onBarCodeScanned={evt => setText(evt.data)}
        style={{ flex: 1 }}
      />
    </NB.View>
  );
};

const InputButton = (props: {
  iconName: string;
  onPress?: Callback;
  onEndEditing?: Callback1<string>;
}) => {
  const [text, setText] = React.useState('');
  return (
    <RN.View style={{ flexDirection: 'row' }}>
      <RN.TextInput
        // autoFocus
        keyboardType="url"
        value={text}
        placeholder="Input your CSV url or scan by QR code"
        style={{
          backgroundColor: 'white',
          fontSize: 14,
          flex: 1,
          paddingLeft: 15,
          marginRight: 5,
        }}
        onChangeText={setText}
        onEndEditing={() => props.onEndEditing && props.onEndEditing(text)}
      />
      <NB.Button light onPress={props.onPress}>
        <NB.Icon name={props.iconName} />
      </NB.Button>
    </RN.View>
  );
};

export const QRCodePage = () => {
  const [showScanner, setShowScanner] = React.useState(false);
  const dispatch = useDispatch();
  const { withLoading } = useIsLoading();
  return (
    <NB.Container>
      <Header bodyText="QR code" />
      <InputButton
        iconName={showScanner ? 'qr-scanner' : 'md-qr-scanner'}
        onPress={React.useCallback(() => setShowScanner(!showScanner), [
          showScanner,
        ])}
        onEndEditing={text =>
          withLoading(async () => {
            await dispatch(action.importByURL(text));
          })
        }
      />

      {showScanner && <CodeScanner onEnd={() => setShowScanner(false)} />}
    </NB.Container>
  );
};
