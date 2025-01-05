import * as React from "react";
import { Style } from ".";
import "katex/dist/katex.css";
import katex from "katex";

const convert = (text: string) => {
  // NOTE: . does not match \n. need to use [\s\S] instead
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, x) => {
    return katex.renderToString(x.replace(/\s/g, " "), {
      displayMode: true,
      throwOnError: false,
    });
  });
  text = text.replace(/\$([\s\S]*?)\$/g, (_, x) => {
    return katex.renderToString(x, {
      displayMode: false,
      throwOnError: false,
    });
  });
  return text;
};

// TODO: validate text
export const Math: React.FC<{ text: string }> = (props) => (
  <Style>
    <div dangerouslySetInnerHTML={{ __html: convert(props.text) }} />
  </Style>
);
