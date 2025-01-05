import cx from "classnames";
import * as React from "react";

export const List: React.FC<{ flex?: boolean; col1?: boolean; children?: React.ReactNode }> = (props) => {
  return (
    <div className="mx-auto w-full">
      <div
        className={cx(
          props.flex
            ? ["flex", "flex-wrap"]
            : props.col1
              ? ["grid", "grid-cols-1 gap-3"]
              : ["grid", "grid-cols-1 gap-3", "md:grid-cols-2", "lg:grid-cols-3"]
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
