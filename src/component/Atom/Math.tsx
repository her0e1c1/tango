import * as React from "react";
import { Style } from ".";
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'
import "github-markdown-css";

export const Math: React.FC<{ text: string }> = (props) => (
  <Style className="markdown-body">
    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {props.text}
    </Markdown>
  </Style>
);
