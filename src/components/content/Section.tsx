import type * as React from "react";

export const Section: React.FC<{ title: string; page?: boolean }> = (props) =>
  props.page ? (
    <div className="mb-2 mt-4 break-words text-title font-bold text-ink">{props.title}</div>
  ) : (
    <div className="mb-2 mt-2 break-words border-b border-border pb-1 text-body font-semibold text-ink-muted">
      {props.title}
    </div>
  );
