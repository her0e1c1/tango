import type * as React from "react";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";
import { BackText, type BackTextProps } from "@/features/card/components/BackText";

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
