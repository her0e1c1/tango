import type * as React from "react";
import { FullScreen } from "@/shared/components/layout/FullScreen";
import { Header, type HeaderProps } from "@/shared/components/layout/Header";
import { Main } from "@/shared/components/layout/Main";
import { Outer } from "@/shared/components/layout/Outer";

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
