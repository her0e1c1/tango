import cx from "classnames";
import * as React from "react";
import { Style } from "@/shared/components/content/Style";
import hljs from "highlight.js";
import "./Code.scss";

const Highlight: React.FC<{ category: string; dark: boolean; children: React.ReactNode }> = (props) => {
  React.useEffect(() => {
    hljs.highlightAll();
  }, []);
  return (
    <pre
      className={cx(
        "max-w-full overflow-x-auto rounded-control border border-border bg-surface-muted p-3 text-ink",
        props.category
      )}
    >
      <code className="block min-w-max" data-theme={props.dark ? "dark" : "light"}>
        {props.children}
      </code>
    </pre>
  );
};

export const Code: React.FC<{ text: string; category: string }> = (props) => {
  return (
    <Style div className="max-w-full overflow-hidden">
      <Highlight category={props.category} dark={document.querySelector("html")?.classList.contains("dark") ?? false}>
        {props.text} {/* Don't pass any <Component /> here but string */}
      </Highlight>
    </Style>
  );
};
