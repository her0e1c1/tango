import * as Expo from 'expo';
import * as React from 'react';
import * as RN from 'react-native';
import * as C from 'src/constant';
import * as firebase from 'firebase/app';
import { auth } from 'src/firebase';
import { useNavigation } from 'react-navigation-hooks';
import { StackActions } from 'react-navigation';

export * from 'src/hooks/action';
import {
  useConfigUpdate,
  useSetEventListener,
  UNSUBSCRIBES,
} from 'src/hooks/action';

export const useGoTo = () => {
  const { navigate } = useNavigation();
  return (page, params?: any) => {
    navigate(page, params);
  };
};

export const useReplaceTo = () => {
  const navi = useNavigation();
  return (page, params?: any) => {
    navi.dispatch(
      StackActions.replace({
        routeName: page,
        params,
      })
    );
  };
};

export const useGoBack = () => {
  const navi = useNavigation();
  return React.useCallback(() => {
    navi.goBack();
  }, [navi]);
};

export const useInit = () => {
  const configUpdate = useConfigUpdate();
  const setEventListener = useSetEventListener();
  return async () => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      __DEV__ && console.log('DEBUG: INIT', user && user.displayName);
      if (!user) return; // Also called after logout
      await configUpdate({
        uid: user.uid,
        displayName: user.displayName,
      });
      await setEventListener(user.uid);
    });
    UNSUBSCRIBES.push(unsubscribe);
  };
};

const useSignIn = () => {
  const init = useInit();
  return async (credential: firebase.auth.AuthCredential) => {
    await firebase.auth().signInWithCredential(credential);
    await init();
  };
};

export const useLoginWithGoogle = () => {
  const signIn = useSignIn();
  const configUpdate = useConfigUpdate();
  return async () => {
    // @ts-ignore
    const result = await Expo.Google.logInAsync({
      androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: C.GOOGLE_IOS_CLIENT_ID,
      scopes: C.GOOGLE_AUTH_SCOPES,
    });
    const { type, idToken, accessToken, refreshToken } = result;
    __DEV__ && console.log('DEBUG: RESULT', result);
    if (type !== 'success') {
      alert(`Can not login with Google account`);
      return;
    }
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    await signIn(credential);
    await configUpdate({
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    });
  };
};

/*
export const loginWithFacebook = () => {
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
*/
/*
export const useGoToCard = (cardId: string) => {
  const deckUpdate = useDeckUpdate();
  const card = useCard(cardId);
  const deck = useDeck(card.deckId);
  let currentIndex = deck.cardOrderIds.findIndex(id => id === cardId);
  if (currentIndex === -1) currentIndex = 0;
  React.useEffect(() => {
    currentIndex !== deck.currentIndex &&
      deckUpdate({ id: deck.id, currentIndex });
  }, [currentIndex]);
};
*/

export const useDimension = () => {
  const window = RN.Dimensions.get('window');
  const [dimension, setDimension] = React.useState({
    width: window.width,
    height: window.height,
  });
  const setEvent = event =>
    setDimension({ height: event.window.height, width: event.window.width });
  React.useEffect(() => {
    RN.Dimensions.addEventListener('change', setEvent);
    return () => {
      RN.Dimensions.removeEventListener('change', setEvent);
    };
  }, []);
  return dimension;
};

export const useScreen = () => {
  React.useEffect(() => {
    RN.StatusBar.setHidden(true);
    Expo.ScreenOrientation.lockAsync(
      Expo.ScreenOrientation.OrientationLock.ALL
    );
    return () => {
      RN.StatusBar.setHidden(false);
      Expo.ScreenOrientation.lockAsync(
        Expo.ScreenOrientation.OrientationLock.PORTRAIT
      );
    };
  }, []);
};
