import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// Ready stores supply authentication and data; the test entry never initializes Firebase.
export const auth = { currentUser: null } as Auth;
export const db = {} as Firestore;
