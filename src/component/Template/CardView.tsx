import * as React from "react";
import * as Organism from "@src/component/Organism";
import { Layout } from "@src/shared/components/Layout";

export const CardView: React.FC<{
  layout?: LayoutProps;
  backText?: BackTextProps;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.backText != null && <Organism.BackText {...props.backText} />}
    </Layout>
  );
};
