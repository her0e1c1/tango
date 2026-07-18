import type * as React from "react";

import { TagMarker, tagClassName } from "@/components/content/tagStyles";

export interface TagLabelProps {
  className?: string;
  label: string;
  selected?: boolean;
}

export const TagLabel: React.FC<TagLabelProps> = ({ className, label, selected }) => (
  <span className={tagClassName({ className, compact: true, selected })} title={label}>
    <TagMarker selected={selected} />
    <span className="min-w-0 max-w-full truncate">{label}</span>
  </span>
);
