// Retried appends must converge on one latest value without disturbing unrelated entries; replacements stay last.
export const upsertById = <Item extends { readonly id: string }>(items: readonly Item[], item: Item): Item[] => [
  ...items.filter(({ id }) => id !== item.id),
  item,
];
