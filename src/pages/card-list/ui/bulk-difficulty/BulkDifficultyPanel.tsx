import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";

export interface BulkDifficultyPanelProps {
  cardCount: number;
  difficultyLowerBound: number;
  difficultyUpperBound: number;
  selectedDifficulty: number | null;
  disabled?: boolean | undefined;
  onDifficultyChange: (difficulty: number | null) => void;
  onRequest: () => void;
}

const createDifficultyOptions = (lowerBound: number, upperBound: number) => {
  const options: { label: string; value: string }[] = [];
  for (let difficulty = lowerBound; difficulty <= upperBound; difficulty += 1) {
    options.push({ label: String(difficulty), value: String(difficulty) });
  }
  return options;
};

/** Presents the bulk difficulty controls for the cards currently visible in the list. */
export const BulkDifficultyPanel: React.FC<BulkDifficultyPanelProps> = (props) => {
  const { t } = useTranslation();
  const titleId = React.useId();
  const selectId = React.useId();
  const controlsDisabled = props.disabled || props.cardCount === 0;
  const options = [
    { label: t("cardList.bulkDifficulty.placeholder"), value: "" },
    ...createDifficultyOptions(props.difficultyLowerBound, props.difficultyUpperBound),
  ];

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-surface border border-border bg-surface p-3 text-ink shadow-surface sm:p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={titleId} className="font-bold">
          {t("cardList.bulkDifficulty.title")}
        </h2>
        <p className="text-caption text-ink-muted">{t("cardList.bulkDifficulty.target", { count: props.cardCount })}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label htmlFor={selectId} className="min-w-0">
          <span className="mb-1 block text-body font-medium">{t("cardList.bulkDifficulty.newDifficulty")}</span>
          <Select
            id={selectId}
            options={options}
            value={props.selectedDifficulty == null ? "" : String(props.selectedDifficulty)}
            disabled={controlsDisabled}
            onChange={(event) => {
              const difficulty = event.currentTarget.value;
              props.onDifficultyChange(difficulty === "" ? null : Number(difficulty));
            }}
          />
        </label>
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          disabled={controlsDisabled || props.selectedDifficulty == null}
          onClick={props.onRequest}
        >
          {t("cardList.bulkDifficulty.request")}
        </Button>
      </div>
    </section>
  );
};
