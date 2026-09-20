import { canRunStudyShortcut, type StudyShortcutAction } from "../queries/canRunStudyShortcut";

export function runStudyShortcut(
  event: KeyboardEvent,
  action: StudyShortcutAction,
  state: { status: string; helpOpen: boolean; showBackText: boolean },
  run: () => void
): void {
  if (canRunStudyShortcut(event, action, state)) run();
}
