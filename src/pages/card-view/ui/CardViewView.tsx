/**
 * @file Composes the Card View Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import type * as React from "react";
import { BackText, type BackTextProps } from "@/features/card";
import { Layout, type LayoutProps } from "@/shared/ui/layout";

export interface CardViewViewProps {
  layout?: LayoutProps;
  backText?: BackTextProps;
}

/**
 * Composes the Card View screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
export const CardViewView: React.FC<CardViewViewProps> = (props) => {
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
