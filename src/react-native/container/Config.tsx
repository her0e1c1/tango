import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import {
  Separator,
  ButtonItem,
  SwithItem,
  PickerItem,
  TextItem,
  SliderItem,
} from 'src/react-native/component';
import {
  useLoginWithGoogle,
  useLogout,
  useClearAll,
} from 'src/react-native/hooks/action';
import { useConfigAttr } from 'src/hooks/state';
import { useThunkAction } from 'src/hooks';
import { Header } from './Common';
import * as action from 'src/react-native/action';
import { useDispatch } from 'react-redux';

const doLogin = loginWithGoogle =>
  RN.Alert.alert('Choose account', '', [
    {
      text: 'Google',
      onPress: loginWithGoogle,
    },
    { text: 'Cancel', onPress: () => {} },
  ]);

const doLogout = logout =>
  RN.Alert.alert('Do you want to logout?', '', [
    {
      text: 'Logout',
      onPress: logout,
    },
    { text: 'Cancel', onPress: () => {} },
  ]);

const LoginItem = React.memo(() => {
  const loginWithGoogle = useLoginWithGoogle();
  const logout = useLogout();
  const uid = useConfigAttr('uid');
  return (
    <ButtonItem
      icon
      body="Login"
      title={Boolean(uid) ? 'Logout' : 'Login'}
      onPress={() =>
        Boolean(uid) ? doLogout(logout) : doLogin(loginWithGoogle)
      }
    />
  );
});

const SWIPE_GESTURES = [
  ['cardSwipeUp', '↑'],
  ['cardSwipeDown', '↓'],
  ['cardSwipeLeft', '←'],
  ['cardSwipeRight', '→'],
];

const CARD_SWIPE_TYPES: cardSwipe[] = [
  'DoNothing',
  'GoBack',
  'GoToPrevCard',
  'GoToNextCard',
  'GoToNextCardMastered',
  'GoToNextCardNotMastered',
  'GoToNextCardToggleMastered',
];

export const ShuffleCardsItem = React.memo(() => {
  return (
    <SwithItem
      icon
      body="Shuffle cards"
      value={useConfigAttr('shuffled')}
      onValueChange={useThunkAction(action.configToggle('shuffled'))}
    />
  );
});

export const ShowHeaderItem = React.memo(() => {
  return (
    <SwithItem
      icon
      body="Show header in main screen"
      value={useConfigAttr('showHeader')}
      onValueChange={useThunkAction(action.configToggle('showHeader'))}
    />
  );
});

export const MaxNumberOfCardsToLearnSliderSection = React.memo(() => {
  const dispatch = useDispatch();
  const v = useConfigAttr('maxNumberOfCardsToLearn');
  const [state, setState] = React.useState(v);
  return (
    <>
      <Separator bordered text={`Max number of cards to learn: ${state}`} />
      <SliderItem
        icon
        min={0}
        max={50}
        value={state}
        onValueChange={setState}
        onSlidingComplete={maxNumberOfCardsToLearn =>
          dispatch(action.type.configUpdate({ maxNumberOfCardsToLearn }))
        }
      />
    </>
  );
});

export const IntervalSliderSection = React.memo(() => {
  const dispatch = useDispatch();
  const v = useConfigAttr('cardInterval');
  const [state, setState] = React.useState(v);
  return (
    <>
      <Separator bordered text={`Interval: ${state} sec`} />
      <SliderItem
        icon
        min={0}
        max={60}
        value={state}
        onValueChange={setState}
        onSlidingComplete={cardInterval =>
          dispatch(action.type.configUpdate({ cardInterval }))
        }
      />
      <SwithItem
        icon
        body="When starting a deck, auto play"
        value={useConfigAttr('defaultAutoPlay')}
        onValueChange={useThunkAction(action.configToggle('defaultAutoPlay'))}
      />
    </>
  );
});

export const SwipeGesturesItem = React.memo(() => {
  const dispatch = useDispatch();
  const config = {
    cardSwipeLeft: useConfigAttr('cardSwipeLeft'),
    cardSwipeUp: useConfigAttr('cardSwipeUp'),
    cardSwipeRight: useConfigAttr('cardSwipeRight'),
    cardSwipeDown: useConfigAttr('cardSwipeDown'),
  };
  return (
    <>
      <SwithItem
        icon
        body="Show Swipe Buttons"
        value={useConfigAttr('showSwipeButtonList')}
        onValueChange={useThunkAction(
          action.configToggle('showSwipeButtonList')
        )}
      />
      {SWIPE_GESTURES.map(([type, label]) => (
        <PickerItem
          icon
          noBorder
          key={type}
          label={label}
          options={CARD_SWIPE_TYPES}
          value={config[type]}
          onValueChange={v => dispatch(action.type.configUpdate({ [type]: v }))}
        />
      ))}
    </>
  );
});

export const AccessTokenItem = React.memo(() => {
  const v = useConfigAttr('googleRefreshToken');
  return (
    <TextItem
      icon
      body="Google Refresh Token"
      right={v.substring(0, 10)}
      onPress={useThunkAction(action.refreshToken())}
    />
  );
});

export const UIDItem = React.memo(() => {
  const uid = useConfigAttr('uid');
  return <TextItem icon body="UID" right={uid.substring(0, 10)} />;
});

export const LastUpdatedItem = React.memo(() => {
  const v = useConfigAttr('lastUpdatedAt');
  return (
    <TextItem icon body="Last Updated" right={new Date(v).toLocaleString()} />
  );
});

export const AppCacheItem = React.memo(() => {
  const clearAll = useClearAll(true);
  return (
    <ButtonItem
      icon
      danger
      body="App Cache"
      title="Clear"
      onPress={() => {
        NB.ActionSheet.show(
          {
            title: 'Clear app cache',
            options: ['Clear', 'Cancel'],
            cancelButtonIndex: 1,
            destructiveButtonIndex: 0,
          },
          async index => {
            if (index === 0) await clearAll();
          }
        );
      }}
    />
  );
});

const BasicSeparator = React.memo(() => {
  const v = useConfigAttr('displayName');
  return <Separator bordered text={`Basic: ${v}`} />;
});

export const Config = React.memo(() => {
  return (
    <NB.List>
      <BasicSeparator />
      <LoginItem />
      <ShuffleCardsItem />
      <ShowHeaderItem />
      <MaxNumberOfCardsToLearnSliderSection />
      <IntervalSliderSection />
      <Separator bordered text="Swipe Gestures" />
      <SwipeGesturesItem />
      <Separator bordered text="Developer" />
      <LastUpdatedItem />
      <UIDItem />
      <AccessTokenItem />
      <AppCacheItem />
    </NB.List>
  );
});

export const ConfigPage = React.memo(() => (
  <NB.Container>
    <Header body={{ title: 'Settings' }} />
    <NB.Content>
      <Config />
    </NB.Content>
  </NB.Container>
));
