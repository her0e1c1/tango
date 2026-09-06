import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useAccountPageModel } from "../model/useAccountPageModel";
import { AccountView } from "./AccountView";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { account, uid, pageState, signIn, signOut } = useAccountPageModel();

  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <AccountView
        isLoggedIn={account != null}
        displayName={account?.displayName ?? null}
        uid={uid}
        signInPending={pageState.signIn.pending}
        signOutPending={pageState.signOut.pending}
        onSignIn={signIn}
        onSignOut={signOut}
      />
    </AppLayout>
  );
};
