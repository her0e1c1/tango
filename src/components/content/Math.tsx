import type * as React from "react";
import { Style } from "@/components/content/Style";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import "github-markdown-css/github-markdown.css";

export const MathContent: React.FC<{ text: string }> = (props) => (
  <Style className="markdown-body max-w-full overflow-x-auto rounded-control bg-surface p-1 text-ink">
    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {props.text}
    </Markdown>
  </Style>
);
