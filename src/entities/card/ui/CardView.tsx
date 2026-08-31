import type * as React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      aria-label={t("card.answerAria")}
      className="mx-auto w-full rounded-surface bg-surface-elevated text-ink shadow-surface"
    >
      {content}
    </section>
  );
};
