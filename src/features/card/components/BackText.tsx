import type * as React from "react";
import { MathContent, Code, Style } from "@/shared/components";

export interface BackTextProps {
  text: string;
  category?: string;
  code?: boolean;
  onClick?: () => void;
}

export const BackText: React.FC<BackTextProps> = (props) => {
  return (
    <Style
      div
      className="mx-auto h-full w-full max-w-reading overflow-x-hidden p-section-gap"
      {...(props.onClick !== undefined ? { onClick: props.onClick } : {})}
    >
      {props.category === "math" ? (
        <MathContent text={props.text} />
      ) : props.code ? (
        <Code text={props.text} category={props.category ?? ""} />
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans">{props.text}</pre>
      )}
      <div className="h-10" />
    </Style>
  );
};
