import cx from "classnames";
import * as React from "react";
import { Style } from "@/components/content/Style";
import hljs from "highlight.js";
import "./Code.scss";

const Highlight: React.FC<{ category: string; dark: boolean; text: string }> = ({ category, dark, text }) => {
  const codeRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const code = codeRef.current;
    if (code == null) return;

    code.textContent = text;
    code.dataset.language = category;
    code.dataset.theme = dark ? "dark" : "light";
    delete code.dataset.highlighted;
    hljs.highlightElement(code);
    return () => {
      delete code.dataset.highlighted;
      code.classList.remove("hljs");
      code.textContent = text;
    };
  }, [category, dark, text]);

  return (
    <pre
      className={cx(
        "max-w-full overflow-x-auto rounded-control border border-border bg-surface-muted p-3 text-ink",
        category
      )}
    >
      <code ref={codeRef} className="block min-w-max" data-theme={dark ? "dark" : "light"}>
        {text}
      </code>
    </pre>
  );
};

export const Code: React.FC<{ text: string; category: string; dark?: boolean }> = ({
  text,
  category,
  dark = false,
}) => {
  return (
    <Style div className="max-w-full overflow-hidden">
      <Highlight category={category} dark={dark} text={text} />
    </Style>
  );
};
