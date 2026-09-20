import type * as React from "react";

import { AppLayout } from "@/widgets/app-layout";

import { useAccountPageModel } from "../model/useAccountPageModel";
import { AccountView } from "./AccountView";

export const AccountPage: React.FC = () => {
  const { auth, pageState, signIn, signOut } = useAccountPageModel();

  return (
    <AppLayout showHeader>
      <AccountView
        isLoggedIn={!auth.isAnonymous}
        displayName={auth.displayName}
        uid={auth.uid}
        signInPending={pageState.signIn.pending}
        signOutPending={pageState.signOut.pending}
        onSignIn={signIn}
        onSignOut={signOut}
      />
    </AppLayout>
  );
};
