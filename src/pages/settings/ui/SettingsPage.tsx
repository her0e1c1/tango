import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useSettingsPageModel } from "../model/useSettingsPageModel";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { form, studyPreferencesLimits } = useSettingsPageModel();
  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <SettingsForm
        form={form}
        studyPreferencesLimits={studyPreferencesLimits}
        version={__APP_VERSION__}
        commitHash={__COMMIT_HASH__}
      />
    </AppLayout>
  );
};
