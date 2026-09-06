import type * as React from "react";
import { AiOutlineUser } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthAccount, useAuthUid } from "@/entities/auth";
import { routes } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";

import { signIn } from "../model/actions/signIn";
import { signOut } from "../model/actions/signOut";
import { useAccountActionState } from "../model/useAccountActionState";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const account = useAuthAccount();
  const uid = useAuthUid();
  const isLoggedIn = account != null;
  // Keep pending states independent so an auth transition cannot make the opposite action look busy.
  const signInState = useAccountActionState();
  const signOutState = useAccountActionState();

  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <section className="mx-auto flex w-full max-w-reading flex-col gap-4 text-ink">
        <h1 className="break-words text-title font-bold text-ink">{t("account.title")}</h1>
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
                {t("account.profile.title")}
              </h2>
              <p className="text-caption text-ink-muted">{t("account.profile.description")}</p>
            </div>
            {isLoggedIn ? (
              <Button
                variant="quiet"
                size="sm"
                loading={signOutState.pending}
                onClick={() => void signOut(signOutState.controls)}
              >
                {t("account.profile.signOut")}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={signInState.pending}
                onClick={() => void signIn(signInState.controls)}
              >
                {t("account.profile.signInWithGoogle")}
              </Button>
            )}
          </div>
          <dl className="divide-y divide-border">
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">{t("account.profile.status")}</dt>
              <dd className="text-right text-caption text-ink-muted">
                {isLoggedIn ? t("account.profile.signedInWithGoogle") : t("account.profile.anonymous")}
              </dd>
            </div>
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">{t("account.profile.displayName")}</dt>
              <dd className="min-w-0 break-words text-right text-caption text-ink-muted">
                {isLoggedIn ? (account.displayName ?? t("account.profile.noName")) : t("account.profile.notAvailable")}
              </dd>
            </div>
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-body font-medium text-ink">{t("account.profile.userId")}</dt>
              <dd className="min-w-0 break-all text-right text-caption text-ink-muted">{uid}</dd>
            </div>
          </dl>
        </section>
      </section>
    </AppLayout>
  );
};
