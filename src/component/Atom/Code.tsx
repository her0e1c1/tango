import cx from "classnames";
import * as React from "react";
import { Style } from ".";
import hljs from "highlight.js";
import "./Code.scss";

const Highlight: React.FC<{ category: string; dark: boolean; children: React.ReactNode }> = (props) => {
  React.useEffect(() => {
    hljs.highlightAll();
  }, []);
  return (
    <pre className={cx("dark:bg-black", props.category)}>
      <code data-theme={props.dark ? "dark" : "light"}>{props.children}</code>
    </pre>
  );
};

export const Code: React.FC<{ text: string; category: string }> = (props) => {
  return (
    <Style div>
      <Highlight category={props.category} dark={document.querySelector("html")?.classList.contains("dark") ?? false}>
        {props.text} {/* Don't pass any <Component /> here but string */}
      </Highlight>
    </Style>
  );
};
