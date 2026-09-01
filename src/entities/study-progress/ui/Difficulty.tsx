import cx from "classnames";
import type * as React from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_DIFFICULTY } from "../model/difficulty";

export interface DifficultyProps {
  difficulty?: number | undefined;
  large?: boolean;
  className?: string;
}

/** Shows relative Card difficulty with the neutral prior as the visual midpoint. */
export const Difficulty: React.FC<DifficultyProps> = (props) => {
  const { t } = useTranslation();
  const difficulty = props.difficulty ?? DEFAULT_DIFFICULTY;
  const cue =
    difficulty < DEFAULT_DIFFICULTY
      ? ("easy" as const)
      : difficulty > DEFAULT_DIFFICULTY
        ? ("hard" as const)
        : ("neutral" as const);

  return (
    <div
      role="status"
      aria-label={t("difficulty.aria", { difficulty, cue: t(`difficulty.${cue}`) })}
      className={cx(
        "inline-flex justify-center rounded-pill font-semibold text-ink-inverse",
        props.large ? "size-10 text-lg" : "size-8 text-caption",
        {
          "bg-success": cue === "easy",
          "bg-info": cue === "neutral",
          "bg-danger": cue === "hard",
        },
        props.className
      )}
    >
      <span className="self-center">{difficulty}</span>
    </div>
  );
};
