import { useId } from "react";
import { AiOutlineUser } from "react-icons/ai";

import { useAuthSession } from "@/entities/auth";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { Button } from "@/shared/ui/button";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";

interface SettingsAccountProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsAccount = ({ login, logout }: SettingsAccountProps) => {
  const headingId = useId();
  const authState = useAuthSession();
  const linkedUser = authState.status === "authenticated" && !authState.isAnonymous ? authState : undefined;
  const signIn = useSignIn(login);
  const signOut = useSignOut(linkedUser == null ? undefined : logout);
  const operation = linkedUser == null ? signIn.signIn : signOut.signOut;
  const pending = linkedUser == null ? signIn.pending : signOut.pending;
  const error = linkedUser == null ? signIn.error : signOut.error;
  const runOperation = () => void operation().catch(() => undefined);

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-accent-primary"
        >
          <AiOutlineUser />
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-body font-bold text-ink">
            Account
          </h2>
          <p className="text-caption text-ink-muted">Profile and sign-in</p>
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border">
        <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-ink-inverse"
            >
              <AiOutlineUser />
            </span>
            <div className="min-w-0">
              <p className="break-words text-body font-medium text-ink">
                {linkedUser == null ? "Google Login" : (linkedUser.displayName ?? "No name")}
              </p>
              <p className="text-caption text-ink-muted">
                {linkedUser == null ? "Sync your decks across devices" : "Signed in with Google"}
              </p>
            </div>
          </div>
          <Button variant={linkedUser == null ? "primary" : "quiet"} size="sm" loading={pending} onClick={runOperation}>
            {linkedUser == null ? "Login" : "Logout"}
          </Button>
        </div>
        <RemoteMutationNotice
          pending={pending}
          error={error}
          onRetry={runOperation}
          pendingLabel={linkedUser == null ? "Signing in…" : "Signing out…"}
          errorLabel={linkedUser == null ? "Unable to sign in." : "Unable to sign out."}
        />
      </div>
    </section>
  );
};
