import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { routes } from "@/shared/router";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";

import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { accountPageStore } from "./store";

export const useAccountPageModel = () => {
  const navigate = useNavigate();
  useKey("t", () => void navigate(routes.deckList.to()));
  const auth = useAuth();
  const pageState = useStore(accountPageStore);

  return {
    auth,
    pageState,
    signIn: () => void signInAction(),
    signOut: () => void signOutAction(),
  };
};
