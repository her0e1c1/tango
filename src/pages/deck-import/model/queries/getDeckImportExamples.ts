import { deckImportExamples } from "../../lib/examples";
import { getDeckImportCardPreview } from "./getDeckImportCardPreview";

export function getDeckImportExamples() {
  return deckImportExamples.map((example) => ({
    ...example,
    cards: example.cards.map(getDeckImportCardPreview),
  }));
}
