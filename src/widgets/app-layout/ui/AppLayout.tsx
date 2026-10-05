import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { setDarkMode, usePreferences } from "@/entities/preference";
import { useInvalidCardIds } from "@/entities/card";
import { routes } from "@/shared/router";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const preferences = usePreferences();
  const invalidCardIds = useInvalidCardIds();
  // Application navigation must remain available while the page-owned shell scrolls.
  const { fixedHeader = true, children, ...layoutProps } = props;

  return (
    <Layout
      {...layoutProps}
      fixedHeader={fixedHeader}
      headerProps={{
        dark: preferences.appearance.darkMode,
        labels: {
          menu: t("header.menu"),
          switchToLightMode: t("header.switchToLightMode"),
          switchToDarkMode: t("header.switchToDarkMode"),
          importDecks: t("header.importDecks"),
          openAccount: t("header.openAccount"),
          openSettings: t("header.openSettings"),
          studyHistory: t("studyHistory.title"),
        },
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate(routes.deckList.to()),
        onClickImport: () => void navigate(routes.deckImport.to()),
        onClickAccount: () => void navigate(routes.account.to()),
        onClickStudyHistory: () => void navigate(routes.studyHistory.to()),
        onClickSettings: () => void navigate(routes.settings.to()),
      }}
    >
      {invalidCardIds.length > 0 && (
        // Keep the warning inside the viewport-sized flex layout so full-screen controls use the remaining height.
        <p
          className="mx-shell-gutter my-4 shrink-0 rounded-surface border border-warning bg-surface px-4 py-3 text-body text-ink"
          role="status"
        >
          {t("savedCards.invalid", { count: invalidCardIds.length })}
        </p>
      )}
      {children}
    </Layout>
  );
};
