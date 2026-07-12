import * as React from "react";
import * as Organism from "@src/component/Organism";
import { Layout } from "@src/shared/components/Layout";

export const ConfigForm: React.FC<{
  layout?: LayoutProps;
  configForm?: ConfigFormProps;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.configForm != null && <Organism.ConfigForm {...props.configForm} />}
    </Layout>
  );
};
