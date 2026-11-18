export {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  linkWithPopup,
  signInAnonymously,
  signInWithCredential,
  signOut,
} from "@firebase/auth";
export type {
  Auth,
  User,
  UserCredential,
} from "@firebase/auth";

export const beforeAuthStateChanged: typeof import("@firebase/auth").beforeAuthStateChanged = () => () => undefined;
export const onIdTokenChanged: typeof import("@firebase/auth").onIdTokenChanged = () => () => undefined;
