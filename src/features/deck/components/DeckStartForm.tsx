import * as React from "react";
import { Form, FormItem, Section, Slider, Switch } from "@src/shared/components";
import { TagFilter, type TagFilterProps } from "@src/features/deck/components/TagFilter";

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
  return (
    <Form div>
      <Section title={`score range ${scoreText(props.scoreMax, props.scoreMin)}`} />
      <FormItem label="max">
        <Switch {...props.scoreMaxSwitchProps} />
      </FormItem>
      <Slider {...props.scoreMaxSliderProps} />
      <FormItem label="min">
        <Switch {...props.scoreMinSwitchProps} />
      </FormItem>
      <Slider {...props.scoreMinSliderProps} />
      <Section title="tags" />
      <TagFilter {...props.tagFilterProps} />
    </Form>
  );
};
