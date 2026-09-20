import { useKey, useLatest } from "react-use";
import { runStudyShortcut } from "./runStudyShortcut";

export function useStudyShortcuts(deckId: string): void {
  const latest = useLatest(deckId);
  useKey(
    (event) => ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "b", " "].includes(event.key),
    (event) => {
      runStudyShortcut(event, latest.current);
    }
  );
}
