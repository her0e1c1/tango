import * as React from "react";
import { Layout, type LayoutProps } from "@src/shared/components/Layout";
import { BackText, type BackTextProps } from "@src/features/card/components/BackText";

export interface CardViewTemplateProps {
  layout?: LayoutProps;
  backText?: BackTextProps;
}

export const CardViewTemplate: React.FC<CardViewTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.backText != null && <BackText {...props.backText} />}
    </Layout>
  );
};
