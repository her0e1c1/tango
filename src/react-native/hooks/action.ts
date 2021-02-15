import * as React from "react";
import * as AppAuth from "expo-app-auth";
import * as RN from "react-native";
import * as C from "src/constant";
import { auth } from "src/firebase";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Google from "expo-google-app-auth";
export * from "src/hooks/action";
import {
  useConfigUpdate,
  useSetEventListener,
  UNSUBSCRIBES,
} from "src/hooks/action";
const firebase = require("firebase");

export const useInit = () => {
  const configUpdate = useConfigUpdate();
  const setEventListener = useSetEventListener();
  return async () => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      __DEV__ && console.log("DEBUG: INIT", user && user.displayName);
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

export const useLoginWithGoogle = () => {
  const init = useInit();
  const configUpdate = useConfigUpdate();
  return async () => {
    const result = await Google.logInAsync({
      androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
      androidStandaloneAppClientId: C.GOOGLE_ANDROID_CLIENT_ID_STANDALONE,
      iosClientId: C.GOOGLE_IOS_CLIENT_ID,
      iosStandaloneAppClientId: C.GOOGLE_IOS_CLIENT_ID,
      scopes: C.GOOGLE_AUTH_SCOPES,
      redirectUrl: `${AppAuth.OAuthRedirect}:/oauth2redirect/google`,
    });
    // @ts-ignore
    const { type, accessToken, refreshToken, idToken } = result;
    __DEV__ && console.log("DEBUG: RESULT", result);
    if (type !== "success") {
      alert(`Can not login with Google account`);
      return;
    }
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    await firebase.auth().signInWithCredential(credential);
    await configUpdate({
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    });
    await init();
  };
};

export const useScreen = (reset: boolean = true) => {
  React.useEffect(() => {
    RN.StatusBar.setHidden(true);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
    return () => {
      if (!reset) return;
      RN.StatusBar.setHidden(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, [reset]);
};
