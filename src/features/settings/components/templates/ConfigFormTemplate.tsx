import type * as React from "react";
import { Layout } from "@/shared/components/layout/Layout";
import { ConfigForm, type ConfigFormProps } from "@/features/settings/components/ConfigForm";

export interface ConfigFormTemplateProps {
  layout?: React.ComponentProps<typeof Layout>;
  configForm?: ConfigFormProps;
}

export const ConfigFormTemplate: React.FC<ConfigFormTemplateProps> = (props) => {
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
