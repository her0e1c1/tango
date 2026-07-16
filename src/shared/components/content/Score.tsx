import cx from "classnames";
import type * as React from "react";

export const Score: React.FC<{ score?: number; large?: boolean; className?: string }> = (props) => {
  const score = props.score ?? 0;
  const cue = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  return (
    <div
      role="status"
      aria-label={`Score ${score}, ${cue}`}
      className={cx(
        "flex justify-center rounded-pill font-semibold text-ink-inverse",
        {
          "h-5 min-w-5 px-1 text-caption": !props.large,
          "h-10 min-w-10 px-2 text-lg": props.large,
          "bg-info": score === 0,
          "bg-success": score > 0,
          "bg-danger": score < 0,
        },
        props.className
      )}
    >
      <span className="self-center">{score}</span>
    </div>
  );
};
