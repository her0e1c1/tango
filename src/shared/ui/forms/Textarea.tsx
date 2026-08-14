import type { ComponentProps } from "react";

import { textControlClassName } from "./textControlStyles";

type TextareaProps = Omit<ComponentProps<"textarea">, "children">;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea {...props} className={textControlClassName("text", className)} />
);
