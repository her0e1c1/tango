import { useKey, useLatest } from "react-use";
import { runStudyShortcut } from "./runStudyShortcut";

export function useStudyShortcuts(uid: string, deckId: string, status: "studying" | "preparing" | "invalid"): void {
  const latest = useLatest({ uid, deckId, status });
  useKey(
    (event) => ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "b", " "].includes(event.key),
    (event) => {
      const current = latest.current;
      runStudyShortcut(event, current.uid, current.deckId, current.status);
    }
  );
}
