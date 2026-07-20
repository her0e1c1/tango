/**
 * @file Composes the card feature's complete Card View Template screen.
 * Data and callbacks arrive through props, which keeps this presentation usable in both a live
 * container and Storybook.
 */

import type * as React from "react";
import { Layout, type LayoutProps } from "@/components/layout/Layout";
import { BackText, type BackTextProps } from "@/features/card/components/BackText";

export interface CardViewTemplateProps {
  layout?: LayoutProps;
  backText?: BackTextProps;
}

/**
 * Composes the complete Card View Template screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
export const CardViewTemplate: React.FC<CardViewTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.backText != null && (
        <section className="mx-auto w-full max-w-reading rounded-surface bg-surface-elevated text-ink shadow-surface">
          <BackText {...props.backText} />
        </section>
      )}
    </Layout>
  );
};
