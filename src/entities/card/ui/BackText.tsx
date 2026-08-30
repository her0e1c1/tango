/**
 * @file Defines the Card Entity's Back Text presentation component.
 * The component renders prepared Card content and reports user intent through callbacks while data
 * access stays outside the view.
 */

import type * as React from "react";
import { Code, MathContent, Style } from "@/shared/ui/content";

export interface BackTextProps {
  text: string;
  category?: string;
  code?: boolean;
  dark?: boolean;
  onClick?: () => void;
}

/**
 * Renders the Back Text user interface.
 * Displays a card's answer content, including rich text and optional code or mathematical
 * notation.
 */
export const BackText: React.FC<BackTextProps> = (props) => (
  <Style
    div
    className="mx-auto min-h-full w-full overflow-x-hidden"
    {...(props.onClick !== undefined ? { onClick: props.onClick } : {})}
  >
    <div className="mx-auto min-h-full w-full max-w-content py-section-gap pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))]">
      {props.category === "math" ? (
        <MathContent text={props.text} />
      ) : props.code ? (
        <Code text={props.text} category={props.category ?? ""} dark={props.dark ?? false} />
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans text-body">{props.text}</pre>
      )}
      <div className="h-[calc(var(--spacing-section-gap)+env(safe-area-inset-bottom))]" />
    </div>
  </Style>
);
