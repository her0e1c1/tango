import type * as React from "react";
import { Form, FormItem, Section, Slider, Switch } from "@/components";
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

const scoreText = (max: number | null, min: number | null): string => {
  if (max != null && min != null) {
    return `${min}~${max}`;
  } else if (min != null) {
    return `${min}~`;
  } else if (max != null) {
    return `~${max}`;
  } else {
    return "";
  }
};

export const DeckStartForm: React.FC<DeckStartFormProps> = (props) => {
  const range = scoreText(props.scoreMax, props.scoreMin);

  return (
    <Form div>
      <div className="space-y-3 rounded-surface border border-border bg-surface p-4 shadow-surface">
        <Section title={`score range${range ? ` ${range}` : ""}`} />
        <FormItem label="max">
          <Switch {...props.scoreMaxSwitchProps} />
        </FormItem>
        <Slider {...props.scoreMaxSliderProps} />
        <FormItem label="min">
          <Switch {...props.scoreMinSwitchProps} />
        </FormItem>
        <Slider {...props.scoreMinSliderProps} />
      </div>
      <TagFilter {...props.tagFilterProps} />
    </Form>
  );
};
