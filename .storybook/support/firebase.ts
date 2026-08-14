/**
 * @file Provides Storybook-safe Firebase authentication composition values.
 * Page stories supply a fixture-backed session store, so the real Firebase app must not initialize or
 * open emulator and persistence connections inside the preview iframe.
 */

import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export const auth = { currentUser: null } as Auth;
export const db = {} as Firestore;
