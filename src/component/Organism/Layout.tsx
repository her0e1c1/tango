import * as React from "react";
import { Outer, Main, FullScreen } from "../Molecule";
import { Header } from ".";

const Footer = () => <div className="pb-10" />;

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
