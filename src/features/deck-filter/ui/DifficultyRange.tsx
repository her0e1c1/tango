/**
 * @file Defines the deck filter's difficulty range presentation component.
 */

import { useId, useRef } from "react";
import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";

export interface DifficultyRangeProps {
  lowerBound: number;
  maximum: number | null;
  minimum: number | null;
  onClear: () => void;
  onMaximumChange: (value: number | null) => void;
  onMinimumChange: (value: number | null) => void;
  upperBound: number;
}

interface DifficultySelectProps {
  boundary: "maximum" | "minimum";
  describedBy: string;
  difficulties: number[];
  id: string;
  invalid: boolean;
  onChange: (value: number) => void;
  value: number;
}

const displayDifficulty = (value: number): string => String(value).replace("-", "−");

const difficultyOptions = (
  standardDifficulties: number[],
  current: number,
  otherBoundary: number,
  isAllowed: (difficulty: number, boundary: number) => boolean
): number[] => {
  const candidates = new Set(standardDifficulties);

  // Persisted values can predate the current UI range or form an invalid pair. Keeping the active
  // value visible prevents rendering from silently normalizing saved data and leaves a recovery path.
  candidates.add(current);

  return [...candidates]
    .filter((difficulty) => difficulty === current || isAllowed(difficulty, otherBoundary))
    .sort((left, right) => left - right);
};

const DifficultySelect = ({
  ref: selectRef,
  ...props
}: DifficultySelectProps & { ref?: React.RefObject<HTMLSelectElement | null> }) => {
  const { t } = useTranslation();
  const keyPrefix = `deckFilter.difficultyRange.${props.boundary}` as const;

  return (
    <div className="min-w-0">
      <label htmlFor={props.id} className="text-caption font-medium text-ink-muted">
        {t(`${keyPrefix}.label`)}
      </label>
      <Select
        ref={selectRef}
        id={props.id}
        className="mt-1"
        value={String(props.value)}
        aria-label={t(`${keyPrefix}.aria`)}
        aria-describedby={props.describedBy}
        aria-invalid={props.invalid || undefined}
        options={props.difficulties.map((difficulty) => ({
          label: displayDifficulty(difficulty),
          value: String(difficulty),
        }))}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      <p id={`${props.id}-description`} className="sr-only">
        {t(`${keyPrefix}.description`)}
      </p>
    </div>
  );
};

/**
 * Lets the user choose independent inclusive difficulty boundaries without changing persisted values on render.
 */
export const DifficultyRange: React.FC<DifficultyRangeProps> = (props) => {
  const { t } = useTranslation();
  const idPrefix = useId();
  const minimumSelectRef = useRef<HTMLSelectElement>(null);
  const headingId = `${idPrefix}-difficulty-heading`;
  const minimumId = `${idPrefix}-minimum-difficulty`;
  const maximumId = `${idPrefix}-maximum-difficulty`;
  const warningId = `${idPrefix}-difficulty-warning`;
  // Legacy Decks can still store null boundaries; within the fixed public difficulty domain those
  // values are equivalent to the explicit endpoints shown by the controls.
  const minimum = props.minimum ?? props.lowerBound;
  const maximum = props.maximum ?? props.upperBound;
  const invalid = minimum > maximum;
  const standardDifficulties = Array.from(
    { length: props.upperBound - props.lowerBound + 1 },
    (_, index) => props.lowerBound + index
  );
  const minimumDifficulties = difficultyOptions(
    standardDifficulties,
    minimum,
    maximum,
    (difficulty, upperBoundary) => difficulty <= upperBoundary
  );
  const maximumDifficulties = difficultyOptions(
    standardDifficulties,
    maximum,
    minimum,
    (difficulty, lowerBoundary) => difficulty >= lowerBoundary
  );
  const minimumDescribedBy = `${minimumId}-description${invalid ? ` ${warningId}` : ""}`;
  const maximumDescribedBy = `${maximumId}-description${invalid ? ` ${warningId}` : ""}`;
  const status = t("deckFilter.difficultyRange.status.range", {
    minimum: displayDifficulty(minimum),
    maximum: displayDifficulty(maximum),
  });

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-title font-semibold text-ink">
          {t("deckFilter.difficultyRange.title")}
        </h2>
        <Button
          variant="quiet"
          size="sm"
          className="border-0 text-accent-primary"
          hidden={minimum === props.lowerBound && maximum === props.upperBound}
          onClick={() => {
            props.onClear();
            // The clear action hides its own button on the next render, so keyboard focus must move
            // to a stable control before that render commits.
            minimumSelectRef.current?.focus();
          }}
        >
          {t("deckFilter.difficultyRange.clear")}{" "}
          <span className="sr-only">{t("deckFilter.difficultyRange.clearLimits")}</span>
        </Button>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
        <DifficultySelect
          ref={minimumSelectRef}
          id={minimumId}
          boundary="minimum"
          value={minimum}
          difficulties={minimumDifficulties}
          invalid={invalid}
          describedBy={minimumDescribedBy}
          onChange={props.onMinimumChange}
        />
        <span aria-hidden="true" className="flex min-h-touch items-center text-caption text-ink-muted">
          {t("deckFilter.difficultyRange.separator")}
        </span>
        <DifficultySelect
          id={maximumId}
          boundary="maximum"
          value={maximum}
          difficulties={maximumDifficulties}
          invalid={invalid}
          describedBy={maximumDescribedBy}
          onChange={props.onMaximumChange}
        />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      {invalid ? (
        <p id={warningId} role="alert" className="rounded-control border border-danger p-3 text-caption text-danger">
          {t("deckFilter.difficultyRange.invalid")}
        </p>
      ) : null}
    </section>
  );
};
