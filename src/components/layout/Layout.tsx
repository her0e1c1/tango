/**
 * @file Defines the reusable Layout component in the shared layout library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import { FullScreen } from "@/components/layout/FullScreen";
import { Header, type HeaderProps } from "@/components/layout/Header";
import { Main } from "@/components/layout/Main";
import { Outer } from "@/components/layout/Outer";

/**
 * Renders the Footer user interface.
 * Reserves bottom space, including the device safe area, so page content is not clipped at the
 * viewport edge.
 */
const Footer = () => <div className="shrink-0 pb-[calc(var(--spacing-section-gap)+env(safe-area-inset-bottom))]" />;
const fixedHeaderOffsetClass = "pt-[calc(var(--spacing-touch)+1rem+env(safe-area-inset-top))]";

export interface LayoutProps {
  showHeader?: boolean;
  fixedHeader?: boolean;
  scroll?: boolean;
  fullscreen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  headerProps?: HeaderProps;
}

/**
 * Renders the Layout user interface.
 * Combines an optional header, the page's main content, and bottom spacing while accounting for a
 * fixed header.
 */
export const Layout: React.FC<LayoutProps> = (props) => {
  const fixedHeader = props.showHeader && (props.headerProps?.fixed ?? props.fixedHeader);
  const header = props.showHeader && (
    <Header {...(props.fixedHeader !== undefined ? { fixed: props.fixedHeader } : {})} {...props.headerProps} />
  );

  if (props.fullscreen) {
    return (
      <FullScreen
        {...(fixedHeader ? { className: fixedHeaderOffsetClass } : {})}
        {...(props.scroll !== undefined ? { scroll: props.scroll } : {})}
        {...(props.onClick !== undefined ? { onClick: props.onClick } : {})}
      >
        {header}
        {props.children}
      </FullScreen>
    );
  }
  return (
    <Outer {...(fixedHeader ? { className: fixedHeaderOffsetClass } : {})}>
      {header}
      <Main>{props.children}</Main>
      <Footer />
    </Outer>
  );
};
