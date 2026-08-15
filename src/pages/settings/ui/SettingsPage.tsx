import type * as React from "react";
import { useId } from "react";
import { AiOutlineDown, AiOutlineTool } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthUid } from "@/entities/auth";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import { SettingsForm, usePreferencesFormState } from "@/features/settings";
import { AppLayout } from "@/widgets/app-layout";
import { SettingsAccount } from "@/widgets/settings-account";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const preferences = usePreferences();
  const authUid = useAuthUid();
  const navigate = useNavigate();
  const advancedHeadingId = useId();

  const formState = usePreferencesFormState({
    preferences,
    onSubmit: updatePreferences,
  });
  useKey("t", () => void navigate("/"));

  return (
    <AppLayout showHeader>
      <section className="mx-auto flex w-full max-w-reading flex-col gap-4 text-ink">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h1 className="break-words text-title font-bold text-ink">Settings</h1>
          <p className="text-caption text-ink-muted">Changes are saved automatically</p>
        </div>
        <SettingsAccount login={login} logout={logout} />
        <SettingsForm {...formState} />
        <details
          aria-labelledby={advancedHeadingId}
          className="group overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-accent-primary"
            >
              <AiOutlineTool />
            </span>
            <span className="min-w-0 flex-1">
              <h2 id={advancedHeadingId} className="text-body font-bold text-ink">
                Advanced
              </h2>
              <span className="block text-caption text-ink-muted">Version and user ID</span>
            </span>
            <AiOutlineDown
              aria-hidden="true"
              className="shrink-0 text-ink-muted transition-transform duration-normal ease-calm group-open:rotate-180"
            />
          </summary>
          <div className="divide-y divide-border border-t border-border">
            <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
              <span className="text-body font-medium text-ink">Version</span>
              <span className="min-w-0 break-all text-right text-caption text-ink-muted">{__APP_VERSION__}</span>
            </div>
            <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
              <span className="shrink-0 text-body font-medium text-ink">User ID</span>
              <span className="min-w-0 break-all text-right text-caption text-ink-muted">{authUid}</span>
            </div>
          </div>
        </details>
      </section>
    </AppLayout>
  );
};
