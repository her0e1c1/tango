/**
 * @file Defines the deck filter's score range presentation component.
 */

import { useId, useRef } from "react";
import type * as React from "react";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";

const NO_LIMIT_VALUE = "";
const NO_LIMIT_LABEL = "-";
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

const scoreRangeStatus = (minimum: number | null, maximum: number | null): string => {
  if (minimum != null && maximum != null) return `Score range: ${displayScore(minimum)} to ${displayScore(maximum)}.`;
  if (minimum != null) return `Minimum score: ${displayScore(minimum)}. No maximum score.`;
  if (maximum != null) return `Maximum score: ${displayScore(maximum)}. No minimum score.`;
  return "No score limits.";
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

const ScoreSelect = ({
  ref: selectRef,
  ...props
}: ScoreSelectProps & { ref?: React.RefObject<HTMLSelectElement | null> }) => (
  <div className="min-w-0">
    <label htmlFor={props.id} className="text-caption font-medium text-ink-muted">
      {props.label}
    </label>
    <Select
      ref={selectRef}
      id={props.id}
      className="mt-1"
      value={props.value == null ? NO_LIMIT_VALUE : String(props.value)}
      aria-label={`${props.label} score`}
      aria-describedby={props.describedBy}
      aria-invalid={props.invalid || undefined}
      options={[
        { label: NO_LIMIT_LABEL, value: NO_LIMIT_VALUE },
        ...props.scores.map((score) => ({ label: displayScore(score), value: String(score) })),
      ]}
      onChange={(event) =>
        props.onChange(event.currentTarget.value === NO_LIMIT_VALUE ? null : Number(event.currentTarget.value))
      }
    />
    <p id={`${props.id}-description`} className="sr-only">
      A dash means no {props.label.toLowerCase()} score. {props.description}
    </p>
  </div>
);

/**
 * Lets the user choose independent inclusive score boundaries without changing persisted values on render.
 */
export const ScoreRange: React.FC<ScoreRangeProps> = (props) => {
  const idPrefix = useId();
  const minimumSelectRef = useRef<HTMLSelectElement>(null);
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
      className="space-y-3 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-title font-semibold text-ink">
          Score range
        </h2>
        <Button
          variant="quiet"
          size="sm"
          className="border-0 text-accent-primary"
          hidden={props.minimum == null && props.maximum == null}
          onClick={() => {
            props.onClear();
            // The clear action hides its own button on the next render, so keyboard focus must move
            // to a stable control before that render commits.
            minimumSelectRef.current?.focus();
          }}
        >
          Clear <span className="sr-only">limits</span>
        </Button>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
        <ScoreSelect
          ref={minimumSelectRef}
          id={minimumId}
          label="Minimum"
          value={props.minimum}
          scores={minimumScores}
          invalid={invalid}
          describedBy={minimumDescribedBy}
          description="Include cards at or above this score."
          onChange={props.onMinimumChange}
        />
        <span aria-hidden="true" className="flex min-h-touch items-center text-caption text-ink-muted">
          to
        </span>
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
      <p role="status" aria-live="polite" className="sr-only">
        {scoreRangeStatus(props.minimum, props.maximum)}
      </p>
      {invalid ? (
        <p id={warningId} role="alert" className="rounded-control border border-danger p-3 text-caption text-danger">
          Minimum score must not be greater than maximum score.
        </p>
      ) : null}
    </section>
  );
};
