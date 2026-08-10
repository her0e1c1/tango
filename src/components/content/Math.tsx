/**
 * @file Defines the reusable Math component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import { Style } from "@/components/content/Style";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import "github-markdown-css/github-markdown.css";

/**
 * Renders the Math Content user interface.
 * Converts the supplied Markdown text, including mathematical notation, into styled readable
 * content.
 */
export const MathContent: React.FC<{ text: string }> = (props) => (
  <Style className="markdown-body max-w-full overflow-x-auto rounded-control bg-surface p-1 text-ink">
    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {props.text}
    </Markdown>
  </Style>
);
