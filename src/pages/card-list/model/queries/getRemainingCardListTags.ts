export function getRemainingCardListTags(selectedTags: string[], removedTag: string): string[] {
  return selectedTags.filter((tag) => tag !== removedTag);
}
