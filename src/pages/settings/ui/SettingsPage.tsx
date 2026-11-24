import type * as React from "react";

import { AppLayout } from "@/widgets/app-layout";

import { useSettingsPageModel } from "../model/useSettingsPageModel";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const { form, onChange, studyPreferencesLimits, version, commitHash } = useSettingsPageModel();

  return (
    <AppLayout showHeader>
      <SettingsForm
        form={form}
        onChange={onChange}
        studyPreferencesLimits={studyPreferencesLimits}
        version={version}
        commitHash={commitHash}
      />
    </AppLayout>
  );
};
