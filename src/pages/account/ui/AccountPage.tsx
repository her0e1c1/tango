import type * as React from "react";
import { AiOutlineUser } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthAccount, useAuthUid } from "@/entities/auth";
import { routes } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

import { useSignIn } from "../model/useSignIn";
import { useSignOut } from "../model/useSignOut";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const account = useAuthAccount();
  const uid = useAuthUid();
  // Keep operation state separate so an auth transition cannot expose feedback from the action that just finished.
  const signIn = useSignIn();
  const signOut = useSignOut();
  const isLoggedIn = account != null;
  const operation = isLoggedIn
    ? {
        run: signOut.signOut,
        pending: signOut.pending,
        error: signOut.error,
        pendingLabel: "Signing out…",
        errorLabel: "Unable to sign out.",
      }
    : {
        run: signIn.signIn,
        pending: signIn.pending,
        error: signIn.error,
        pendingLabel: "Signing in…",
        errorLabel: "Unable to sign in.",
      };
  const runOperation = () => void operation.run().catch(() => undefined);

  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <section className="mx-auto flex w-full max-w-reading flex-col gap-4 text-ink">
        <h1 className="break-words text-title font-bold text-ink">Account</h1>
        <section
          aria-labelledby="account-profile-heading"
          className="overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-ink-inverse"
            >
              <AiOutlineUser />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="account-profile-heading" className="text-body font-bold text-ink">
                Profile
              </h2>
              <p className="text-caption text-ink-muted">Identity and Google sign-in</p>
            </div>
            <Button
              variant={isLoggedIn ? "quiet" : "primary"}
              size="sm"
              loading={operation.pending}
              onClick={runOperation}
            >
              {isLoggedIn ? "Sign out" : "Sign in with Google"}
            </Button>
          </div>
          <dl className="divide-y divide-border">
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">Status</dt>
              <dd className="text-right text-caption text-ink-muted">
                {isLoggedIn ? "Signed in with Google" : "Anonymous account"}
              </dd>
            </div>
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">Display name</dt>
              <dd className="min-w-0 break-words text-right text-caption text-ink-muted">
                {isLoggedIn ? (account.displayName ?? "No name") : "Not available"}
              </dd>
            </div>
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">User ID</dt>
              <dd className="min-w-0 break-all text-right text-caption text-ink-muted">{uid}</dd>
            </div>
          </dl>
          <RemoteMutationNotice
            pending={operation.pending}
            error={operation.error}
            onRetry={runOperation}
            pendingLabel={operation.pendingLabel}
            errorLabel={operation.errorLabel}
          />
        </section>
      </section>
    </AppLayout>
  );
};
