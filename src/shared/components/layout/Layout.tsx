import * as React from "react";
import { FullScreen } from "@src/shared/components/layout/FullScreen";
import { Header, type HeaderProps } from "@src/shared/components/layout/Header";
import { Main } from "@src/shared/components/layout/Main";
import { Outer } from "@src/shared/components/layout/Outer";

const Footer = () => <div className="pb-10" />;

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
  if (props.fullscreen) {
    return (
      <FullScreen
        {...(props.scroll !== undefined ? { scroll: props.scroll } : {})}
        {...(props.onClick !== undefined ? { onClick: props.onClick } : {})}
      >
        {props.showHeader && (
          <Header {...(props.fixedHeader !== undefined ? { fixed: props.fixedHeader } : {})} {...props.headerProps} />
        )}
        {props.children}
      </FullScreen>
    );
  }
  return (
    <Outer>
      {props.showHeader && (
        <Header {...(props.fixedHeader !== undefined ? { fixed: props.fixedHeader } : {})} {...props.headerProps} />
      )}
      <Main>{props.children}</Main>
      <Footer />
    </Outer>
  );
};
