/**
 * @file Defines the deck filter's difficulty range presentation component.
 */

import { useId, useRef } from "react";
import type * as React from "react";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";

const NO_LIMIT_VALUE = "";
const NO_LIMIT_LABEL = "-";
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
  describedBy: string;
  description: string;
  id: string;
  invalid: boolean;
  label: "Maximum" | "Minimum";
  onChange: (value: number | null) => void;
  difficulties: number[];
  value: number | null;
}

const displayDifficulty = (value: number): string => String(value).replace("-", "−");

const difficultyRangeStatus = (minimum: number | null, maximum: number | null): string => {
  if (minimum != null && maximum != null)
    return `Difficulty range: ${displayDifficulty(minimum)} to ${displayDifficulty(maximum)}.`;
  if (minimum != null) return `Minimum difficulty: ${displayDifficulty(minimum)}. No maximum difficulty.`;
  if (maximum != null) return `Maximum difficulty: ${displayDifficulty(maximum)}. No minimum difficulty.`;
  return "No difficulty limits.";
};

const difficultyOptions = (
  standardDifficulties: number[],
  current: number | null,
  otherBoundary: number | null,
  isAllowed: (difficulty: number, boundary: number) => boolean
): number[] => {
  const candidates = new Set(standardDifficulties);

  // Persisted values can predate the current UI range or form an invalid pair. Keeping the active
  // value visible prevents rendering from silently normalizing saved data and leaves a recovery path.
  if (current != null) candidates.add(current);

  return [...candidates]
    .filter((difficulty) => difficulty === current || otherBoundary == null || isAllowed(difficulty, otherBoundary))
    .sort((left, right) => left - right);
};

const DifficultySelect = ({
  ref: selectRef,
  ...props
}: DifficultySelectProps & { ref?: React.RefObject<HTMLSelectElement | null> }) => (
  <div className="min-w-0">
    <label htmlFor={props.id} className="text-caption font-medium text-ink-muted">
      {props.label}
    </label>
    <Select
      ref={selectRef}
      id={props.id}
      className="mt-1"
      value={props.value == null ? NO_LIMIT_VALUE : String(props.value)}
      aria-label={`${props.label} difficulty`}
      aria-describedby={props.describedBy}
      aria-invalid={props.invalid || undefined}
      options={[
        { label: NO_LIMIT_LABEL, value: NO_LIMIT_VALUE },
        ...props.difficulties.map((difficulty) => ({
          label: displayDifficulty(difficulty),
          value: String(difficulty),
        })),
      ]}
      onChange={(event) =>
        props.onChange(event.currentTarget.value === NO_LIMIT_VALUE ? null : Number(event.currentTarget.value))
      }
    />
    <p id={`${props.id}-description`} className="sr-only">
      A dash means no {props.label.toLowerCase()} difficulty. {props.description}
    </p>
  </div>
);

/**
 * Lets the user choose independent inclusive difficulty boundaries without changing persisted values on render.
 */
export const DifficultyRange: React.FC<DifficultyRangeProps> = (props) => {
  const idPrefix = useId();
  const minimumSelectRef = useRef<HTMLSelectElement>(null);
  const headingId = `${idPrefix}-difficulty-heading`;
  const minimumId = `${idPrefix}-minimum-difficulty`;
  const maximumId = `${idPrefix}-maximum-difficulty`;
  const warningId = `${idPrefix}-difficulty-warning`;
  const invalid = props.minimum != null && props.maximum != null && props.minimum > props.maximum;
  const standardDifficulties = Array.from(
    { length: props.upperBound - props.lowerBound + 1 },
    (_, index) => props.lowerBound + index
  );
  const minimumDifficulties = difficultyOptions(
    standardDifficulties,
    props.minimum,
    props.maximum,
    (difficulty, maximum) => difficulty <= maximum
  );
  const maximumDifficulties = difficultyOptions(
    standardDifficulties,
    props.maximum,
    props.minimum,
    (difficulty, minimum) => difficulty >= minimum
  );
  const minimumDescribedBy = `${minimumId}-description${invalid ? ` ${warningId}` : ""}`;
  const maximumDescribedBy = `${maximumId}-description${invalid ? ` ${warningId}` : ""}`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-title font-semibold text-ink">
          Difficulty range
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
        <DifficultySelect
          ref={minimumSelectRef}
          id={minimumId}
          label="Minimum"
          value={props.minimum}
          difficulties={minimumDifficulties}
          invalid={invalid}
          describedBy={minimumDescribedBy}
          description="Include cards at or above this difficulty."
          onChange={props.onMinimumChange}
        />
        <span aria-hidden="true" className="flex min-h-touch items-center text-caption text-ink-muted">
          to
        </span>
        <DifficultySelect
          id={maximumId}
          label="Maximum"
          value={props.maximum}
          difficulties={maximumDifficulties}
          invalid={invalid}
          describedBy={maximumDescribedBy}
          description="Include cards at or below this difficulty."
          onChange={props.onMaximumChange}
        />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {difficultyRangeStatus(props.minimum, props.maximum)}
      </p>
      {invalid ? (
        <p id={warningId} role="alert" className="rounded-control border border-danger p-3 text-caption text-danger">
          Minimum difficulty must not be greater than maximum difficulty.
        </p>
      ) : null}
    </section>
  );
};
