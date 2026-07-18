import type * as React from "react";

import { TagMarker, tagClassName } from "@/components/content/tagStyles";

export interface TagLabelProps {
  className?: string;
  label: string;
  selected?: boolean;
}

export const TagLabel: React.FC<TagLabelProps> = ({ className, label, selected }) => (
  <span
    className={tagClassName({
      compact: true,
      ...(className !== undefined ? { className } : {}),
      ...(selected !== undefined ? { selected } : {}),
    })}
    title={label}
  >
    <TagMarker {...(selected !== undefined ? { selected } : {})} />
    <span className="min-w-0 max-w-full truncate">{label}</span>
  </span>
);
