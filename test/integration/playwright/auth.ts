import { io, events } from "./io";

export {
  useAuthSession,
  useAuth,
  authSessionStore,
  getAuthSession,
  getAuthUid,
  replaceAuthSession,
} from "../../../src/entities/auth";

export const signInWithGoogle: typeof io.signInWithGoogle = (...args) => {
  events.push({ name: "signInWithGoogle", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.signInWithGoogle(...args);
};
export const signOutCurrentUser: typeof io.signOutCurrentUser = (...args) => {
  events.push({
    name: "signOutCurrentUser",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.signOutCurrentUser(...args);
};
