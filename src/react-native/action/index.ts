import * as Expo from 'expo';
import * as RN from 'react-native';
import * as C from 'src/constant';
import * as firebase from 'firebase';
import { NavigationActions } from 'react-navigation';

import * as Action from 'src/action';
import { configUpdate } from 'src/action';
import * as type from 'src/action/type';
import { auth } from 'src/firebase';
import * as Selector from 'src/selector';

export * from 'src/action';

const signIn = (
  credential: firebase.auth.AuthCredential
): ThunkAction => async (dispatch, getState) => {
  try {
    await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    dispatch(init());
  } catch (e) {
    __DEV__ && console.log(e);
  }
};

export const loginWithGoogle = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await Expo.Google.logInAsync({
    androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: C.GOOGLE_IOS_CLIENT_ID,
    scopes: C.GOOGLE_AUTH_SCOPE,
  });
  const { type } = result;
  const idToken = (result as any).idToken; // TODO: update @types
  if (type === 'success') {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    dispatch(signIn(credential));
  } else {
    alert(`Can not login with Google account`);
  }
};

export const loginWithFacebook = (): ThunkAction => async (
  dispatch,
  _getState
) => {
  try {
    const result = await Expo.Facebook.logInWithReadPermissionsAsync(
      C.FACEBOOK_APP_ID,
      { permissions: ['public_profile'], behavior: 'web' }
    );
    const { type } = result;
    const token = (result as any).token; // TODO: update @types
    if (type === 'success') {
      // Build Firebase credential with the Facebook access token.
      const credential = firebase.auth.FacebookAuthProvider.credential(token);
      dispatch(signIn(credential));
    }
  } catch (e) {
    alert('Can not login');
  }
};

export const init = (): ThunkAction => async (dispatch, getState) => {
  // await dispatch(Action.config.endLoading());
  // const ok = await dispatch(Action.drive.refreshToken());
  auth.onAuthStateChanged(async user => {
    __DEV__ && console.log('DEBUG: INIT', user);
    if (user) {
      await dispatch(
        Action.configUpdate({ uid: user.uid, displayName: user.displayName })
      );
      const decks = (await dispatch(Action.deckFetch())) as Deck[]; // TODO: fix
      decks.forEach(d => dispatch(Action.cardFetch(d.id)));
    } else {
      console.log('NOT LOGGED IN YET');
    }
  });
};

/*
export const loginWithGoogleOnWeb = (): ThunkAction => async (
  dispatch,
  getState
) => {
  // need to register this url in admin console
  const redirectUrl = AuthSession.getRedirectUrl();
  const scope = C.GOOGLE_AUTH_SCOPE.join('%20');
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `&client_id=${C.GOOGLE_WEB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&scope=${scope}`;
  try {
    let result = await Expo.AuthSession.startAsync({ authUrl });
    const code = (result as any).params.code; // TODO: update @types
    const body = queryString.stringify({
      grant_type: 'authorization_code',
      redirect_uri: redirectUrl,
      client_id: C.GOOGLE_WEB_CLIENT_ID,
      client_secret: C.GOOGLE_WEB_CLIENT_SECRET,
      code,
    });
    const json = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      body,
      headers: new Headers({
        'content-type': 'application/x-www-form-urlencoded',
      }),
    }).then(r => r.json());
    const credential = firebase.auth.GoogleAuthProvider.credential(
      null, // you can skip id token
      json.access_token
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(async () => {
        await dispat:289
        ch(init());
        await dispatch(
          Action.config.updateConfig({
            googleAccessToken: json.access_token,
            googleRefreshToken: json.refresh_token,
          })
        );
      })
      .catch(error => console.log(error));
  } catch (e) {
    console.log(e);
  }
};

*/

export const goBack = () => async (dispatch, getState) => {
  await dispatch(NavigationActions.back());
};
export const goTo = (routeName, params?) => async (dispatch, getState) => {
  await dispatch(NavigationActions.navigate({ routeName, params }));
};

export const goToCardById = (cardId: string, deckId: string) => async (
  dispatch,
  getState
) => {
  const a = NavigationActions.reset({
    index: 1,
    actions: [
      NavigationActions.navigate({ routeName: 'home' }),
      NavigationActions.navigate({
        routeName: 'card',
        params: { cardId, deckId },
      }),
    ],
  });
  await dispatch(a);
};

export const shuffleCardsOrSort = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch(type.card_shuffle(config));
};

export const goToNextCardSetMastered = (
  mastered?: boolean
): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const card = Selector.getCurrentCard(state);
  if (card) {
    await dispatch(Action.cardUpdate({ ...card, mastered: !card.mastered }));
    if (state.config.showMastered) {
      await dispatch(goToNextCard());
    } else if (mastered === false) {
      await dispatch(goToNextCard());
    }
  }
};

export const goToNextCardToggleMastered = () => goToNextCardSetMastered();
export const goToNextCardNotMastered = () => goToNextCardSetMastered(false);
export const goToNextCardMastered = () => goToNextCardSetMastered(true);

export const goToNextCard = (): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const deck = Selector.getCurrentDeck(state);
  const cards = Selector.getCurrentCardList(state);
  const currentIndex = deck.currentIndex + 1;
  if (currentIndex <= cards.length - 1) {
    await dispatch(type.deckBulkInsert([{ ...deck, currentIndex }]));
  } else {
    await dispatch(swipeAll());
  }
};

export const goToPrevCard = (): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const deck = Selector.getCurrentDeck(state);
  const currentIndex = deck.currentIndex - 1;
  if (currentIndex >= 0) {
    await dispatch(type.deckBulkInsert([{ ...deck, currentIndex }]));
  } else {
    // await dispatch(goBack());
  }
};

export const goToCard = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  const state = getState();
  const cards = Selector.getCurrentCardList(getState());
  const deck = state.deck.byId[card.deckId];
  let currentIndex = 0;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id == card.id) {
      currentIndex = i;
    }
  }
  dispatch(type.deckBulkInsert([{ ...deck, currentIndex }]));
};

export const goToCardByIndex = (
  deck: Deck,
  currentIndex: number
): ThunkAction => async (dispatch, getState) => {
  dispatch(type.deckBulkInsert([{ ...deck, currentIndex }]));
};

export const swipeAll = () => async (dispatch, getState) => {
  const deck = Selector.getCurrentDeck(getState());
  await dispatch(type.deckBulkInsert([{ ...deck, currentIndex: 0 }]));
  // await dispatch(goBack());
};

const swipeMapping = {
  // goBack,
  goToPrevCard,
  goToNextCard,
  goToNextCardMastered,
  goToNextCardNotMastered,
  goToNextCardToggleMastered,
};

const cardSwipe = (direction): ThunkAction => async (dispatch, getState) => {
  const config = getState().config;
  if (config.hideBodyWhenCardChanged) {
    await dispatch(configUpdate({ showBody: false, showHint: false }));
  }
  const f = swipeMapping[config[direction]];
  if (f) {
    await dispatch(f());
  } else {
    console.log(`${direction} action is not found`);
  }
};
export const cardSwipeUp = () => cardSwipe('cardSwipeUp');
export const cardSwipeDown = () => cardSwipe('cardSwipeDown');
export const cardSwipeLeft = () => cardSwipe('cardSwipeLeft');
export const cardSwipeRight = () => cardSwipe('cardSwipeRight');

export const startLoading = () => async (dispatch, getState) => {
  dispatch(configUpdate({ isLoading: true }));
};

export const endLoading = () => async (dispatch, getState) => {
  dispatch(configUpdate({ isLoading: false }));
};

export const clearError = () => async (dispatch, getState) => {
  await dispatch(type.configUpdate({ errorCode: undefined }));
};

export const getTheme = (state: RootState): Theme => {
  const theme = state.config.theme;
  if (theme === 'dark') {
    return {
      mainBackgroundColor: 'black',
      mainColor: 'silver',
      titleColor: 'silver',
      masteredColor: 'darkgreen',
      cardBackgroundColor: '#111',
      cardBorderColor: 'gray',
      circleBackgroundColor: '#222',
      bgTextInput: 'gray',
    };
  } else {
    // default
    return {
      mainBackgroundColor: '#1C7ED6',
      mainColor: 'black',
      titleColor: 'white',
      masteredColor: '#51CF66',
      cardBorderColor: 'white',
      cardBackgroundColor: 'white',
      circleBackgroundColor: '#DEE2E6',
      bgTextInput: 'white',
    };
  }
};

export const clearAll = (clearStorage?: boolean): ThunkAction => async (
  dispatch,
  getState
) => {
  clearStorage && (await RN.AsyncStorage.clear());
  await dispatch(type.clear_all());
};

export const drop = (): ThunkAction => async (dispatch, getState) => {
  await dispatch(clearAll(true));
};
