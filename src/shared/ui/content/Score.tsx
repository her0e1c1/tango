/**
 * @file Defines the reusable Score component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";
import { useTranslation } from "react-i18next";

const scoreDisplayLimit = 99;

/**
 * Renders the Score user interface.
 * Formats a numeric score as an accessible status and changes its visual cue for positive,
 * neutral, or negative values.
 */
export const Score: React.FC<{ score?: number; large?: boolean; className?: string }> = (props) => {
  const { t } = useTranslation();
  const score = props.score ?? 0;
  const displayScore =
    score > scoreDisplayLimit
      ? `>${String(scoreDisplayLimit)}`
      : score < -scoreDisplayLimit
        ? `<-${String(scoreDisplayLimit)}`
        : score;
  const isDisplayBounded = Math.abs(score) > scoreDisplayLimit;
  const cueKey = score > 0 ? "score.positive" : score < 0 ? "score.negative" : "score.neutral";
  return (
    <div
      role="status"
      aria-label={t("score.aria", { score, cue: t(cueKey) })}
      className={cx(
        "inline-flex justify-center rounded-pill font-semibold text-ink-inverse",
        {
          "size-8 text-caption": !(props.large || isDisplayBounded),
          "size-8 text-xs": !props.large && isDisplayBounded,
          "size-10 text-lg": props.large && !isDisplayBounded,
          "size-10 text-sm": props.large && isDisplayBounded,
          "bg-info": score === 0,
          "bg-success": score > 0,
          "bg-danger": score < 0,
        },
        props.className
      )}
    >
      <span className="self-center">{displayScore}</span>
    </div>
  );
};
