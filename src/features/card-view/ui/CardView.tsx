import type * as React from "react";

import type { Card } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";

import { BackText } from "./BackText";

export interface CardViewProps {
  card: Card;
  deck: Deck;
  onClick?: () => void;
  variant?: "surface" | "bare";
}

export const CardView: React.FC<CardViewProps> = ({ card, deck, onClick, variant = "surface" }) => {
  const preferences = usePreferences();
  const category = getCategory(deck.category, card.tags);
  const content = (
    <BackText
      category={category}
      code={isHighlightLanguage(category)}
      dark={preferences.appearance.darkMode}
      text={card.backText}
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
