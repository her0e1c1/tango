import * as React from "react";
import * as Organism from "../Organism";

export const ConfigForm: React.FC<{
  layout?: LayoutProps;
  configForm?: ConfigFormProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      {props.configForm != null && <Organism.ConfigForm {...props.configForm} />}
    </Organism.Layout>
  );
};
