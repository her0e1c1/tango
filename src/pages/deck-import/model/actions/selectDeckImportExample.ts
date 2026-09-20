import { deckImportExamples, type DeckImportExampleId } from "../../lib/examples";
import { selectDeckImportFile } from "./selectDeckImportFile";

export async function selectDeckImportExample(id: DeckImportExampleId): Promise<void> {
  const example = deckImportExamples.find((candidate) => candidate.id === id);
  if (example === undefined) return;
  // Examples use the same validation, account guard, lock, and retry identities as uploaded CSVs.
  await selectDeckImportFile(new File([example.csv], example.fileName, { type: "text/csv" }));
}
