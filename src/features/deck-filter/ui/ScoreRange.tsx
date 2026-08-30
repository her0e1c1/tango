/**
 * @file Defines the deck filter's score range presentation component.
 */

import { useId } from "react";
import type * as React from "react";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";

const NO_LIMIT_VALUE = "";
const MINIMUM_STANDARD_SCORE = -10;
const MAXIMUM_STANDARD_SCORE = 10;
const STANDARD_SCORES = Array.from(
  { length: MAXIMUM_STANDARD_SCORE - MINIMUM_STANDARD_SCORE + 1 },
  (_, index) => MINIMUM_STANDARD_SCORE + index
);

export interface ScoreRangeProps {
  maximum: number | null;
  minimum: number | null;
  onClear: () => void;
  onMaximumChange: (value: number | null) => void;
  onMinimumChange: (value: number | null) => void;
}

interface ScoreSelectProps {
  describedBy: string;
  description: string;
  id: string;
  invalid: boolean;
  label: "Maximum" | "Minimum";
  onChange: (value: number | null) => void;
  scores: number[];
  value: number | null;
}

const displayScore = (value: number): string => String(value).replace("-", "−");

const scoreRangeLabel = (minimum: number | null, maximum: number | null): string => {
  if (minimum != null && maximum != null) return `${displayScore(minimum)} to ${displayScore(maximum)}`;
  if (minimum != null) return `${displayScore(minimum)} and above`;
  if (maximum != null) return `${displayScore(maximum)} and below`;
  return "Any score";
};

const scoreOptions = (
  current: number | null,
  otherBoundary: number | null,
  isAllowed: (score: number, boundary: number) => boolean
): number[] => {
  const candidates = new Set(STANDARD_SCORES);

  // Persisted values can predate the current UI range or form an invalid pair. Keeping the active
  // value visible prevents rendering from silently normalizing saved data and leaves a recovery path.
  if (current != null) candidates.add(current);

  return [...candidates]
    .filter((score) => score === current || otherBoundary == null || isAllowed(score, otherBoundary))
    .sort((left, right) => left - right);
};

const ScoreSelect: React.FC<ScoreSelectProps> = (props) => (
  <div className="rounded-control bg-surface-muted p-3">
    <label htmlFor={props.id} className="text-body font-medium text-ink">
      {props.label}
    </label>
    <Select
      id={props.id}
      className="mt-2"
      value={props.value == null ? NO_LIMIT_VALUE : String(props.value)}
      aria-label={`${props.label} score`}
      aria-describedby={props.describedBy}
      aria-invalid={props.invalid || undefined}
      options={[
        { label: "No limit", value: NO_LIMIT_VALUE },
        ...props.scores.map((score) => ({ label: displayScore(score), value: String(score) })),
      ]}
      onChange={(event) =>
        props.onChange(event.currentTarget.value === NO_LIMIT_VALUE ? null : Number(event.currentTarget.value))
      }
    />
    <p id={`${props.id}-description`} className="mt-1 text-caption text-ink-muted">
      {props.description}
    </p>
  </div>
);

/**
 * Lets the user choose independent inclusive score boundaries without changing persisted values on render.
 */
export const ScoreRange: React.FC<ScoreRangeProps> = (props) => {
  const idPrefix = useId();
  const headingId = `${idPrefix}-score-heading`;
  const minimumId = `${idPrefix}-minimum-score`;
  const maximumId = `${idPrefix}-maximum-score`;
  const warningId = `${idPrefix}-score-warning`;
  const invalid = props.minimum != null && props.maximum != null && props.minimum > props.maximum;
  const minimumScores = scoreOptions(props.minimum, props.maximum, (score, maximum) => score <= maximum);
  const maximumScores = scoreOptions(props.maximum, props.minimum, (score, minimum) => score >= minimum);
  const minimumDescribedBy = `${minimumId}-description${invalid ? ` ${warningId}` : ""}`;
  const maximumDescribedBy = `${maximumId}-description${invalid ? ` ${warningId}` : ""}`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-title font-semibold text-ink">
            Score range
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Limit cards by their current score.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            aria-live="polite"
            className="rounded-control bg-surface-muted px-2 py-1 text-caption font-bold text-accent-primary"
          >
            {scoreRangeLabel(props.minimum, props.maximum)}
          </span>
          <Button
            variant="quiet"
            size="sm"
            label="Clear limits"
            disabled={props.minimum == null && props.maximum == null}
            onClick={props.onClear}
          />
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <ScoreSelect
          id={minimumId}
          label="Minimum"
          value={props.minimum}
          scores={minimumScores}
          invalid={invalid}
          describedBy={minimumDescribedBy}
          description="Include cards at or above this score."
          onChange={props.onMinimumChange}
        />
        <ScoreSelect
          id={maximumId}
          label="Maximum"
          value={props.maximum}
          scores={maximumScores}
          invalid={invalid}
          describedBy={maximumDescribedBy}
          description="Include cards at or below this score."
          onChange={props.onMaximumChange}
        />
      </div>
      {invalid ? (
        <p id={warningId} role="alert" className="rounded-control border border-danger p-3 text-caption text-danger">
          Minimum score must not be greater than maximum score.
        </p>
      ) : null}
    </section>
  );
};
