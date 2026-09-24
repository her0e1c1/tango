import { useState } from "react";

export function useCardTagState(initialTags: readonly string[]) {
  // Row identity is presentation state, separate from editable names and persisted Card fields.
  const [tagRowIds, setTagRowIds] = useState<string[]>(() => initialTags.map(() => crypto.randomUUID()));
  return { tagRowIds, setTagRowIds };
}
