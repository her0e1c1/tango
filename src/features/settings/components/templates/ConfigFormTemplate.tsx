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
      <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
        <h1 className="mb-section-gap break-words text-display font-bold text-ink">Settings</h1>
        {props.configForm != null && <ConfigForm {...props.configForm} />}
      </section>
    </Layout>
  );
};
