export function getTagChanges(original: readonly (string | null | undefined)[], values: readonly (string | null)[]) {
  return values.flatMap((name, index) => {
    const previous = original[index] ?? undefined;
    return previous === (name ?? undefined) ? [] : [{ previous, name: name ?? undefined }];
  });
}
