import React from "react";
import { Section, Switch, Slider } from "../Atom";
import { Form, FormItem } from "../Molecule";
import { ControlTagFilter } from ".";
import { type Control, useForm, useWatch } from "react-hook-form";
import { renameKey } from "./form";

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

const SectionScore: React.FC<{ control: Control<Deck> }> = ({ control }) => {
  const scoreMax = useWatch({ control, name: "scoreMax" });
  const scoreMin = useWatch({ control, name: "scoreMin" });
  return <Section title={`score range ${scoreText(scoreMax, scoreMin)}`} />;
};

export const DeckStartForm: React.FC<DeckStartFormProps> = (props) => {
  const [scoreMax, setScoreMax] = React.useState(props.deck.scoreMax != null);
  const [scoreMin, setScoreMin] = React.useState(props.deck.scoreMin != null);

  const { handleSubmit, register, watch, setValue, control } = useForm<Deck>({
    defaultValues: props.deck,
  });

  const onSubmit = props.onSubmit;
  React.useEffect(() => {
    const subscription = watch(() => {
      handleSubmit((data) => {
        onSubmit?.(data);
      })();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [handleSubmit, watch, onSubmit]);

  return (
    <Form div>
      <SectionScore control={control} />
      <FormItem label="max">
        <Switch
          name="scoreMaxSwitch"
          checked={scoreMax}
          onChange={(e) => {
            setValue("scoreMax", e.currentTarget.checked ? 0 : null);
            setScoreMax(e.currentTarget.checked);
          }}
        />
      </FormItem>
      <Slider
        {...renameKey(register("scoreMax", { valueAsNumber: true }))}
        step={1}
        max={10}
        min={-10}
        disabled={!scoreMax}
      />
      <FormItem label="min">
        <Switch
          name="scoreMinSwitch"
          checked={scoreMin}
          onChange={(e) => {
            setValue("scoreMin", e.currentTarget.checked ? 0 : null);
            setScoreMin(e.currentTarget.checked);
          }}
        />
      </FormItem>
      <Slider
        {...renameKey(register("scoreMin", { valueAsNumber: true }))}
        step={1}
        max={10}
        min={-10}
        disabled={!scoreMin}
      />
      <Section title="tags" />
      <ControlTagFilter control={control} tags={props.tags} />
    </Form>
  );
};
