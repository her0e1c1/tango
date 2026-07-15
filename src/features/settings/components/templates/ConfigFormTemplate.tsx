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
      {props.configForm != null && <ConfigForm {...props.configForm} />}
    </Layout>
  );
};
