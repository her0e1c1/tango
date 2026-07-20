import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { DeckStartFormProps } from "@/features/deck/components/DeckStartForm";

export interface UseDeckFilterStateOptions {
  deck: Deck;
  tags: string[];
  onSubmit?: (deck: Deck) => void;
}

export const useDeckFilterState = ({ deck, tags, onSubmit }: UseDeckFilterStateOptions): DeckStartFormProps => {
  const [scoreMaxEnabled, setScoreMaxEnabled] = React.useState(deck.scoreMax != null);
  const [scoreMinEnabled, setScoreMinEnabled] = React.useState(deck.scoreMin != null);
  const { control, handleSubmit, register, setValue, subscribe } = useForm<Deck>({ defaultValues: deck });
  const scoreMax = useWatch({ control, name: "scoreMax" });
  const scoreMin = useWatch({ control, name: "scoreMin" });
  const selectedTags = useWatch({ control, name: "selectedTags" });
  const tagAndFilter = useWatch({ control, name: "tagAndFilter" });

  React.useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: () => void handleSubmit((data) => onSubmit?.(data))(),
    });
  }, [handleSubmit, onSubmit, subscribe]);

  const onClickFilter = (value: boolean) => {
    setValue("tagAndFilter", value);
  };
  const onClickAll = () => {
    setValue("selectedTags", tags);
  };
  const onClickClear = () => {
    setValue("selectedTags", []);
  };
  const onClickTag = (value: string[]) => {
    setValue("selectedTags", value);
  };

  return {
    scoreMax,
    scoreMin,
    scoreMaxSwitchProps: {
      name: "scoreMaxSwitch",
      checked: scoreMaxEnabled,
      onChange: (event) => {
        const enabled = event.currentTarget.checked;
        setValue("scoreMax", enabled ? 0 : null);
        setScoreMaxEnabled(enabled);
      },
    },
    scoreMinSwitchProps: {
      name: "scoreMinSwitch",
      checked: scoreMinEnabled,
      onChange: (event) => {
        const enabled = event.currentTarget.checked;
        setValue("scoreMin", enabled ? 0 : null);
        setScoreMinEnabled(enabled);
      },
    },
    scoreMaxSliderProps: {
      ...register("scoreMax", { valueAsNumber: true }),
      step: 1,
      max: 10,
      min: -10,
      disabled: !scoreMaxEnabled,
    },
    scoreMinSliderProps: {
      ...register("scoreMin", { valueAsNumber: true }),
      step: 1,
      max: 10,
      min: -10,
      disabled: !scoreMinEnabled,
    },
    tagFilterProps: {
      tags,
      selectedTags: selectedTags ?? [],
      tagAndFilter: tagAndFilter ?? false,
      onClickFilter,
      onClickAll,
      onClickClear,
      onClickTag,
    },
  };
};
