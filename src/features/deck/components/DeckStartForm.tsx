import { useId } from "react";
import type * as React from "react";
import { Form, Slider, Switch } from "@/components";
import { TagFilter, type TagFilterProps } from "@/features/deck/components/TagFilter";

export interface DeckStartFormProps {
  scoreMax: number | null;
  scoreMin: number | null;
  scoreMaxSwitchProps: React.ComponentProps<typeof Switch>;
  scoreMinSwitchProps: React.ComponentProps<typeof Switch>;
  scoreMaxSliderProps: React.ComponentProps<typeof Slider>;
  scoreMinSliderProps: React.ComponentProps<typeof Slider>;
  tagFilterProps: TagFilterProps;
}

interface ScoreLimitProps {
  label: "Maximum score" | "Minimum score";
  enabledLabel: string;
  value: number | null;
  switchId: string;
  sliderId: string;
  descriptionId: string;
  switchProps: React.ComponentProps<typeof Switch>;
  sliderProps: React.ComponentProps<typeof Slider>;
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
          {...props.switchProps}
          id={props.switchId}
          aria-label={props.enabledLabel}
          aria-describedby={props.descriptionId}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Slider
          {...props.sliderProps}
          id={props.sliderId}
          aria-label={`${props.label} value`}
          aria-describedby={props.descriptionId}
          aria-valuetext={props.value == null ? `${props.label} disabled` : displayScore(props.value)}
        />
        <span className="min-w-12 rounded-control bg-surface px-2 py-1 text-center text-caption font-bold text-accent-primary">
          {props.value == null ? "Any" : displayScore(props.value)}
        </span>
      </div>
    </div>
  );
};

export const DeckStartForm: React.FC<DeckStartFormProps> = (props) => {
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
            enabledLabel="Enable maximum score"
            value={props.scoreMax}
            switchId={maximumSwitchId}
            sliderId={maximumSliderId}
            descriptionId={maximumDescriptionId}
            switchProps={props.scoreMaxSwitchProps}
            sliderProps={props.scoreMaxSliderProps}
          />
          <ScoreLimit
            label="Minimum score"
            enabledLabel="Enable minimum score"
            value={props.scoreMin}
            switchId={minimumSwitchId}
            sliderId={minimumSliderId}
            descriptionId={minimumDescriptionId}
            switchProps={props.scoreMinSwitchProps}
            sliderProps={props.scoreMinSliderProps}
          />
        </div>
      </section>
      <TagFilter {...props.tagFilterProps} />
    </Form>
  );
};
