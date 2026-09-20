import type { CardRaw } from "@/entities/card";
import { getCategory, isHighlightLanguage } from "@/entities/deck";

export function getDeckImportCardPreview(card: CardRaw) {
  const category = getCategory("", card.tags);
  return {
    ...card,
    contentCategory: category === "math" || isHighlightLanguage(category) ? category : "",
  };
}
