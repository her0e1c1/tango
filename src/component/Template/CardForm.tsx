import * as React from "react";
import * as Organism from "@src/component/Organism";
import { Layout } from "@src/shared/components/Layout";

export const CardForm: React.FC<{
  layout?: LayoutProps;
  cardForm?: CardFormProps;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <Organism.CardForm {...props.cardForm} />
    </Layout>
  );
};
