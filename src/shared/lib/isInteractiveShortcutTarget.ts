export const isInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest('a[href], button, input, select, textarea, [contenteditable="true"], [contenteditable=""]') != null;
