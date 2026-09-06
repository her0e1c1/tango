import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthAccount, useAuthUid } from "@/entities/auth";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { signIn } from "../model/actions/signIn";
import { signOut } from "../model/actions/signOut";
import { useAccountActionState } from "../model/useAccountActionState";
import { AccountView } from "./AccountView";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const account = useAuthAccount();
  const uid = useAuthUid();
  // Keep pending states independent so an auth transition cannot make the opposite action look busy.
  const signInState = useAccountActionState();
  const signOutState = useAccountActionState();

  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <AccountView
        isLoggedIn={account != null}
        displayName={account?.displayName ?? null}
        uid={uid}
        signInPending={signInState.pending}
        signOutPending={signOutState.pending}
        onSignIn={() => void signIn(signInState.controls)}
        onSignOut={() => void signOut(signOutState.controls)}
      />
    </AppLayout>
  );
};
