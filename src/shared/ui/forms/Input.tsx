import type { ComponentProps } from "react";

import { textControlClassName } from "./textControlStyles";

type InputProps = Omit<ComponentProps<"input">, "children">;

export const Input = ({ className, ...props }: InputProps) => (
  <input {...props} className={textControlClassName("text", className)} />
);
