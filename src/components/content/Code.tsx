/**
 * @file Defines the reusable Code component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import * as React from "react";
import { Style } from "@/components/content/Style";
import hljs from "highlight.js";
import "./Code.scss";

/**
 * Renders the Highlight user interface.
 * Highlights the supplied source text with its Prism language category and the selected light or
 * dark theme.
 */
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

/**
 * Renders the Code user interface.
 * Displays source text in a horizontally scrollable code block and delegates syntax coloring to
 * Highlight.
 */
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
