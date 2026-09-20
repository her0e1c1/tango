import { type Control, useWatch } from "react-hook-form";

import { getCategory, isHighlightLanguage } from "@/entities/deck";
import type { CardFormFields } from "../../ui/CardFields";

export function useCardPreviewContent(control: Control<CardFormFields>, deckCategory: string, dark: boolean) {
  const [text, tags] = useWatch({ control, name: ["backText", "tags"] });
  const category = getCategory(deckCategory, tags);
  return { text, category, code: isHighlightLanguage(category), dark };
}
