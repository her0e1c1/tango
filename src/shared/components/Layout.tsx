import * as React from "react";
import { FullScreen } from "@src/shared/components/FullScreen";
import { Header, type HeaderProps } from "@src/shared/components/Header";
import { Main } from "@src/shared/components/Main";
import { Outer } from "@src/shared/components/Outer";

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
      <FullScreen scroll={props.scroll} onClick={props.onClick}>
        {props.showHeader && <Header fixed={props.fixedHeader} {...props.headerProps} />}
        {props.children}
      </FullScreen>
    );
  }
  return (
    <Outer>
      {props.showHeader && <Header fixed={props.fixedHeader} {...props.headerProps} />}
      <Main>{props.children}</Main>
      <Footer />
    </Outer>
  );
};
