/**
 * @file Composes the Settings Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import type * as React from "react";
import { ConfigForm, type ConfigFormProps } from "@/features/settings";
import { Layout } from "@/shared/ui/layout";

export interface SettingsViewProps {
  layout?: React.ComponentProps<typeof Layout>;
  configForm?: ConfigFormProps;
}

/**
 * Composes the Settings screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <section className="mx-auto flex w-full max-w-reading flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h1 className="break-words text-title font-bold text-ink">Settings</h1>
          <p className="text-caption text-ink-muted">Changes are saved automatically</p>
        </div>
        {props.configForm != null && <ConfigForm {...props.configForm} />}
      </section>
    </Layout>
  );
};
