import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

import { auth } from "@/shared/firebase";
import { createAuthRuntime } from "./authController";

export const authRuntime = createAuthRuntime({ auth, onAuthStateChanged, signInAnonymously });

export const { publishAuthenticatedUser, suspendAnonymousBootstrap } = authRuntime;
