import type * as React from "react";
import { useTranslation } from "react-i18next";

export interface BulkDifficultyPanelProps {
  difficultyLowerBound: number;
  difficultyUpperBound: number;
  selectedDifficulty: number | null;
  disabled?: boolean | undefined;
  onDifficultyChange: (difficulty: number) => void;
}

export const BulkDifficultyPanel: React.FC<BulkDifficultyPanelProps> = (props) => {
  const { t } = useTranslation();
  const difficulties = Array.from(
    { length: props.difficultyUpperBound - props.difficultyLowerBound + 1 },
    (_, index) => props.difficultyLowerBound + index
  );
  return (
    <fieldset disabled={props.disabled} className="mt-4">
      <legend className="mb-2 text-body font-medium">{t("cardList.bulkDifficulty.newDifficulty")}</legend>
      <div className="grid grid-cols-5 gap-2">
        {difficulties.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            disabled={props.disabled}
            aria-pressed={difficulty === props.selectedDifficulty}
            onClick={() => props.onDifficultyChange(difficulty)}
            className="min-h-touch rounded-control border border-border bg-surface p-3 text-body font-bold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus aria-pressed:border-accent-primary aria-pressed:bg-accent-primary aria-pressed:text-ink-inverse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {difficulty}
          </button>
        ))}
      </div>
    </fieldset>
  );
};
