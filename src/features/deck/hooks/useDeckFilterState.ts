/**
 * @file Provides the deck feature's Use Deck Filter State React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import { deckFilterValuesFrom, type DeckFilterPatch, type DeckFilterValues } from "@/entities/deck";
import type { DeckStartFormProps } from "@/features/deck/components/DeckStartForm";

export interface UseDeckFilterStateOptions {
  deck: Deck;
  tags: string[];
  onSubmit?: (patch: DeckFilterPatch) => unknown;
}

/**
 * Provides the deck filter state values and operations needed by React components.
 * Callers receive one focused interface without coordinating the deck feature's stores and
 * services themselves.
 */
export const useDeckFilterState = ({ deck, tags, onSubmit }: UseDeckFilterStateOptions): DeckStartFormProps => {
  const { control, register, reset, setValue } = useForm<DeckFilterValues>({
    defaultValues: deckFilterValuesFrom(deck),
  });
  const scoreMax = useWatch({ control, name: "scoreMax" });
  const scoreMin = useWatch({ control, name: "scoreMin" });
  const selectedTags = useWatch({ control, name: "selectedTags" });
  const tagAndFilter = useWatch({ control, name: "tagAndFilter" });
  const remoteFilterKey = JSON.stringify(deckFilterValuesFrom(deck));
  const previousRemoteFilterKey = React.useRef(remoteFilterKey);
  const scoreMaxRegistration = register("scoreMax", { valueAsNumber: true });
  const scoreMinRegistration = register("scoreMin", { valueAsNumber: true });

  React.useEffect(() => {
    if (previousRemoteFilterKey.current === remoteFilterKey) return;
    previousRemoteFilterKey.current = remoteFilterKey;
    reset(deckFilterValuesFrom(deck));
  }, [deck, remoteFilterKey, reset]);

  const submit = (patch: DeckFilterPatch) => {
    void Promise.resolve()
      .then(() => onSubmit?.(patch))
      .catch(() => undefined);
  };

  /**
   * Handles the click filter callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickFilter = (value: boolean) => {
    setValue("tagAndFilter", value);
    submit({ tagAndFilter: value });
  };
  /**
   * Handles the click all callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickAll = () => {
    setValue("selectedTags", tags);
    submit({ selectedTags: tags });
  };
  /**
   * Handles the click clear callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickClear = () => {
    setValue("selectedTags", []);
    submit({ selectedTags: [] });
  };
  /**
   * Handles the click tag callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickTag = (value: string[]) => {
    setValue("selectedTags", value);
    submit({ selectedTags: value });
  };

  return {
    scoreMax: scoreMax ?? null,
    scoreMin: scoreMin ?? null,
    scoreMaxSwitchProps: {
      name: "scoreMaxSwitch",
      checked: scoreMax != null,
      onChange: (event) => {
        const value = event.currentTarget.checked ? 0 : null;
        setValue("scoreMax", value);
        submit({ scoreMax: value });
      },
    },
    scoreMinSwitchProps: {
      name: "scoreMinSwitch",
      checked: scoreMin != null,
      onChange: (event) => {
        const value = event.currentTarget.checked ? 0 : null;
        setValue("scoreMin", value);
        submit({ scoreMin: value });
      },
    },
    scoreMaxSliderProps: {
      ...scoreMaxRegistration,
      step: 1,
      max: 10,
      min: -10,
      disabled: scoreMax == null,
      onChange: (event) => {
        void scoreMaxRegistration.onChange(event);
        submit({ scoreMax: event.currentTarget.valueAsNumber });
      },
    },
    scoreMinSliderProps: {
      ...scoreMinRegistration,
      step: 1,
      max: 10,
      min: -10,
      disabled: scoreMin == null,
      onChange: (event) => {
        void scoreMinRegistration.onChange(event);
        submit({ scoreMin: event.currentTarget.valueAsNumber });
      },
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
