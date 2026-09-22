export function changeStudyHistoryFilters(
  current: URLSearchParams,
  selection: { deckId: string } | { days: 7 | 30 | 90 } | { startDate: string; endDate: string }
) {
  const params = new URLSearchParams(current);
  if ("deckId" in selection) {
    if (selection.deckId === "") params.delete("deckId");
    else params.set("deckId", selection.deckId);
  } else {
    for (const name of ["days", "start", "end"]) params.delete(name);
    if ("days" in selection) params.set("days", String(selection.days));
    else {
      params.set("start", selection.startDate);
      params.set("end", selection.endDate);
    }
  }
  return params;
}
