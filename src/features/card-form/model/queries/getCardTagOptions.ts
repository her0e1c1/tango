export function getCardTagOptions(availableTags: readonly string[], draftTags: readonly string[]): string[] {
  return [...new Set([...availableTags, ...draftTags])]
    .filter((tag) => tag.trim().length > 0)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}
