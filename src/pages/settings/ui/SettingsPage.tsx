import type * as React from "react";

import { AppLayout } from "@/widgets/app-layout";

import { useSettingsPageModel } from "../model/useSettingsPageModel";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const { form, studyPreferencesLimits } = useSettingsPageModel();

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
