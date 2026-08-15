import { useId } from "react";
import type * as React from "react";

import { Form, Slider, Switch } from "@/shared/ui/forms";
import type { DeckFilterState } from "../model/useDeckFilterState";
import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps extends DeckFilterState {
  tags: string[];
}

interface ScoreLimitProps {
  label: "Maximum score" | "Minimum score";
  value: number | null;
  switchId: string;
  sliderId: string;
  descriptionId: string;
  onChange: (value: number | null) => void;
}

const displayScore = (value: number): string => `${value}`.replace("-", "−");

const scoreRangeLabel = (min: number | null, max: number | null): string => {
  if (min != null && max != null) return `${displayScore(min)} to ${displayScore(max)}`;
  if (min != null) return `${displayScore(min)} and above`;
  if (max != null) return `${displayScore(max)} and below`;
  return "Any score";
};

const ScoreLimit: React.FC<ScoreLimitProps> = (props) => {
  const boundary = props.label === "Maximum score" ? "upper" : "lower";
  return (
    <div className="rounded-control bg-surface-muted p-3">
      <div className="flex min-h-touch items-center justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={props.switchId} className="text-body font-medium text-ink">
            {props.label}
          </label>
          <p id={props.descriptionId} className="text-caption text-ink-muted">
            {props.value == null ? `No ${boundary} limit` : `Current limit: ${displayScore(props.value)}`}
          </p>
        </div>
        <Switch
          id={props.switchId}
          name={`${props.sliderId}-enabled`}
          checked={props.value != null}
          aria-label={`Enable ${props.label.toLowerCase()}`}
          aria-describedby={props.descriptionId}
          onChange={(event) => props.onChange(event.currentTarget.checked ? 0 : null)}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Slider
          id={props.sliderId}
          name={props.sliderId}
          value={`${props.value ?? 0}`}
          step={1}
          max={10}
          min={-10}
          disabled={props.value == null}
          aria-label={`${props.label} value`}
          aria-describedby={props.descriptionId}
          aria-valuetext={props.value == null ? `${props.label} disabled` : displayScore(props.value)}
          onChange={(event) => props.onChange(event.currentTarget.valueAsNumber)}
        />
        <span className="min-w-12 rounded-control bg-surface px-2 py-1 text-center text-caption font-bold text-accent-primary">
          {props.value == null ? "Any" : displayScore(props.value)}
        </span>
      </div>
    </div>
  );
};

export const DeckFilterForm: React.FC<DeckFilterFormProps> = (props) => {
  const idPrefix = useId();
  const headingId = `${idPrefix}-score-heading`;
  const maximumSwitchId = `${idPrefix}-maximum-enabled`;
  const maximumSliderId = `${idPrefix}-maximum-value`;
  const maximumDescriptionId = `${idPrefix}-maximum-description`;
  const minimumSwitchId = `${idPrefix}-minimum-enabled`;
  const minimumSliderId = `${idPrefix}-minimum-value`;
  const minimumDescriptionId = `${idPrefix}-minimum-description`;

  return (
    <Form div>
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
          <span className="rounded-control bg-surface-muted px-2 py-1 text-caption font-bold text-accent-primary">
            {scoreRangeLabel(props.scoreMin, props.scoreMax)}
          </span>
        </header>
        <div className="space-y-3">
          <ScoreLimit
            label="Maximum score"
            value={props.scoreMax}
            switchId={maximumSwitchId}
            sliderId={maximumSliderId}
            descriptionId={maximumDescriptionId}
            onChange={props.setScoreMax}
          />
          <ScoreLimit
            label="Minimum score"
            value={props.scoreMin}
            switchId={minimumSwitchId}
            sliderId={minimumSliderId}
            descriptionId={minimumDescriptionId}
            onChange={props.setScoreMin}
          />
        </div>
      </section>
      <TagFilter
        tags={props.tags}
        selectedTags={props.selectedTags}
        tagAndFilter={props.tagAndFilter}
        onClickFilter={props.setTagAndFilter}
        onClickAll={() => props.setSelectedTags(props.tags)}
        onClickClear={() => props.setSelectedTags([])}
        onClickTag={props.setSelectedTags}
      />
    </Form>
  );
};
