import type * as React from "react";

import { TagMarker, tagClassName } from "@/components/content/tagStyles";

export interface RemovableTagProps {
  className?: string;
  label: string;
  onRemove: (label: string) => void;
}

export const RemovableTag: React.FC<RemovableTagProps> = ({ className, label, onRemove }) => (
  <button
    type="button"
    aria-label={`Remove ${label} filter`}
    className={tagClassName({ className, interactive: true, selected: true })}
    onClick={() => onRemove(label)}
  >
    <TagMarker selected />
    <span className="min-w-0 max-w-full truncate">{label}</span>
    <span aria-hidden="true" className="ml-2 shrink-0">
      ×
    </span>
  </button>
);
