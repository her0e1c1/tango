/**
 * @file Defines the reusable Math component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import "github-markdown-css/github-markdown.css";
import "katex/dist/katex.min.css";
import type * as React from "react";
import Markdown, { type Components } from "react-markdown";
import { useTranslation } from "react-i18next";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { Style } from "./Style";

const MarkdownLink: NonNullable<Components["a"]> = ({ node: _node, style, ...props }) => (
  <a {...props} style={{ ...style, textDecoration: "underline" }} />
);

const MarkdownInput: NonNullable<Components["input"]> = ({ node: _node, ...props }) => {
  const { t } = useTranslation();

  return (
    <input
      {...props}
      aria-label={props["aria-label"] ?? (props.type === "checkbox" ? t("richContent.taskStatus") : undefined)}
    />
  );
};

const markdownComponents = {
  a: MarkdownLink,
  input: MarkdownInput,
} satisfies Components;

/**
 * Renders the Math Content user interface.
 * Converts the supplied Markdown text, including mathematical notation, into styled readable
 * content.
 */
export const MathContent: React.FC<{ text: string }> = (props) => (
  <Style className="markdown-body max-w-full overflow-x-auto rounded-control bg-surface p-1 text-ink">
    <Markdown components={markdownComponents} remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {props.text}
    </Markdown>
  </Style>
);
