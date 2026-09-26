export function getCardListEmptyState(
  reason: "no-cards" | "filter-zero" | undefined,
  onAddCard: () => void,
  onClearFilters: () => void
) {
  return reason === undefined ? undefined : { reason, onAddCard, onClearFilters };
}
