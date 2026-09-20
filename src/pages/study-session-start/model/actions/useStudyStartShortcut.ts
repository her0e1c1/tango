import { useKey } from "react-use";

export function useStudyStartShortcut(
  start: () => void,
  { saving, cardCount }: { saving: boolean; cardCount: number }
): void {
  const startFromEnter = (event: KeyboardEvent) => {
    if (saving || cardCount === 0) return;
    // Interactive controls keep their native Enter behavior instead of starting a session.
    if (event.target instanceof Element && event.target.closest("a[href], button, input, select, textarea")) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);
}
