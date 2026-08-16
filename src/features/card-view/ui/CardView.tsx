import type * as React from "react";

import { BackText } from "./BackText";

export interface CardViewProps {
  text: string;
  category?: string;
  code?: boolean;
  dark?: boolean;
  onClick?: () => void;
  variant?: "surface" | "bare";
}

export const CardView: React.FC<CardViewProps> = ({ text, category, code, dark, onClick, variant = "surface" }) => {
  const content = (
    <BackText
      text={text}
      {...(category !== undefined ? { category } : {})}
      {...(code !== undefined ? { code } : {})}
      {...(dark !== undefined ? { dark } : {})}
      {...(onClick !== undefined ? { onClick } : {})}
    />
  );

  if (variant === "bare") return content;

  return (
    <section
      aria-label="Card answer"
      className="mx-auto w-full max-w-reading rounded-surface bg-surface-elevated text-ink shadow-surface"
    >
      {content}
    </section>
  );
};
