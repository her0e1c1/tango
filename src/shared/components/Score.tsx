import cx from "classnames";
import * as React from "react";

export const Score: React.FC<{ score?: number; large?: boolean; className?: string }> = (props) => {
  const score = props.score ?? 0;
  return (
    <div
      className={cx(
        "rounded-full flex justify-center",
        {
          "text-sm w-5 h-5 ": !props.large,
          "text-lg w-10 h-10 ": props.large,
          "text-blue-700 bg-blue-300": score === 0,
          "dark:text-blue-300 dark:bg-blue-700": score === 0,
          "text-green-700 bg-green-300": score > 0,
          "dark:text-green-300 dark:bg-green-700": score > 0,
          "text-red-700 bg-red-300": score < 0,
          "dark:text-red-300 dark:bg-red-700": score < 0,
        },
        props.className
      )}
    >
      <span className="self-center">{score}</span>
    </div>
  );
};
