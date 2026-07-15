import type * as React from "react";
import { Math, Code, Style } from "@/shared/components";

export interface BackTextProps {
  text: string;
  category?: string;
  code?: boolean;
  onClick?: () => void;
}

export const BackText: React.FC<BackTextProps> = (props) => {
  return (
    <Style div className="h-full w-full p-5" {...(props.onClick !== undefined ? { onClick: props.onClick } : {})}>
      {props.category === "math" ? (
        <Math text={props.text} />
      ) : props.code ? (
        <Code text={props.text} category={props.category ?? ""} />
      ) : (
        <pre>{props.text}</pre>
      )}
      <div className="h-10" />
    </Style>
  );
};
