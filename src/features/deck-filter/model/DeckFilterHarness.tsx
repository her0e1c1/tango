import type { Deck } from "@/entities/deck";
import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterState } from "./useDeckFilterState";

export const DeckFilterHarness = ({ deck, tags }: { deck: Deck; tags: string[] }) => {
  const deckFilterForm = useDeckFilterState({ deck, tags });
  return <DeckFilterForm {...deckFilterForm} />;
};
