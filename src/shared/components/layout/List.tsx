import cx from "classnames";
import type * as React from "react";

export const List: React.FC<{ flex?: boolean; col1?: boolean; children?: React.ReactNode }> = (props) => {
  return (
    <div className="mx-auto w-full max-w-content text-ink">
      <div
        className={cx(
          props.flex
            ? ["flex", "flex-wrap", "gap-section-gap"]
            : props.col1
              ? ["grid", "grid-cols-1", "gap-section-gap"]
              : ["grid", "grid-cols-1", "gap-section-gap", "md:grid-cols-2", "lg:grid-cols-3"]
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
