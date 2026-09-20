export function canStartStudyFromEnter(event: KeyboardEvent, saving: boolean, cardsLength: number): boolean {
  // Interactive controls keep their native Enter behavior instead of starting a session.
  const interactive =
    event.target instanceof Element && event.target.closest("a[href], button, input, select, textarea") != null;
  return !saving && cardsLength > 0 && !interactive;
}
