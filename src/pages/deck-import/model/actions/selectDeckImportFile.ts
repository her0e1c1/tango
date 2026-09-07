import { getAuthSession } from "@/entities/auth";
import { generateCardId } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import { parseCsv } from "../../lib/cardCsv";
import { beginFileSelection, cancelFileSelection, completeFileSelection, failFileSelection } from "../store";
import { prepareDeckImport } from "./prepareDeckImport";

const getCurrentUid = (): string => {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
};

export async function selectDeckImportFile(file: File): Promise<void> {
  const selection = beginFileSelection(getCurrentUid());
  if (selection === undefined) return;
  try {
    const analysis = await parseCsv(await file.text());
    // A read may outlive the session that selected it; never prepare it for a different account.
    if (getCurrentUid() !== selection.uid) {
      cancelFileSelection();
      return;
    }
    const preparedImport =
      analysis.invalidCount === 0 && analysis.rows.length > 0
        ? prepareDeckImport(
            { name: file.name, rows: analysis.rows, storageMode: selection.storageMode },
            { uid: selection.uid, generateDeckId, generateCardId }
          )
        : undefined;
    completeFileSelection({ kind: "selected", preview: { deckName: file.name, analysis }, preparedImport });
  } catch (error: unknown) {
    if (getCurrentUid() !== selection.uid) {
      cancelFileSelection();
      return;
    }
    failFileSelection(error);
  }
}
