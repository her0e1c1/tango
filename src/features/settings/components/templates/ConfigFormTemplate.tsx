import * as React from "react";
import { Layout } from "@src/shared/components/Layout";
import { ConfigForm, type ConfigFormProps } from "@src/features/settings/components/ConfigForm";

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
