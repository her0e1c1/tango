import { downloadTextFile } from "@/shared/files";
import { deckImportExamples, type DeckImportExampleId } from "../../lib/examples";

export function downloadDeckImportExample(id: DeckImportExampleId): void {
  const example = deckImportExamples.find((candidate) => candidate.id === id);
  if (example === undefined) return;
  downloadTextFile(example.csv, example.fileName, "text/csv;charset=utf-8");
}
