import type * as React from "react";

import { ConfigForm, type ConfigFormProps } from "@/features/settings";

export interface SettingsViewProps {
  configForm?: ConfigFormProps;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => (
  <section className="mx-auto flex w-full max-w-reading flex-col gap-4">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <h1 className="break-words text-title font-bold text-ink">Settings</h1>
      <p className="text-caption text-ink-muted">Changes are saved automatically</p>
    </div>
    {props.configForm != null && <ConfigForm {...props.configForm} />}
  </section>
);
