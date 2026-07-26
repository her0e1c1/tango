/**
 * @file Provides the deck feature's Use Deck Filter State React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { DeckFilterPatch } from "@/domain/deckFilter";
import { deckFilterPatchFrom } from "@/domain/deckFilter";
import type { DeckStartFormProps } from "@/features/deck/components/DeckStartForm";

export interface UseDeckFilterStateOptions {
  deck: Deck;
  tags: string[];
  onSubmit?: (patch: DeckFilterPatch) => void | Promise<unknown>;
}

/**
 * Provides the deck filter state values and operations needed by React components.
 * Callers receive one focused interface without coordinating the deck feature's stores and
 * services themselves.
 */
export const useDeckFilterState = ({ deck, tags, onSubmit }: UseDeckFilterStateOptions): DeckStartFormProps => {
  const { control, handleSubmit, register, setValue, subscribe } = useForm<DeckFilterPatch>({
    defaultValues: deckFilterPatchFrom(deck),
  });
  const scoreMax = useWatch({ control, name: "scoreMax" });
  const scoreMin = useWatch({ control, name: "scoreMin" });
  const selectedTags = useWatch({ control, name: "selectedTags" });
  const tagAndFilter = useWatch({ control, name: "tagAndFilter" });

  React.useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: () => {
        void handleSubmit(async (data) => {
          await onSubmit?.(deckFilterPatchFrom(data));
        })().catch(() => undefined);
      },
    });
  }, [handleSubmit, onSubmit, subscribe]);

  /**
   * Handles the click filter callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickFilter = (value: boolean) => {
    setValue("tagAndFilter", value);
  };
  /**
   * Handles the click all callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickAll = () => {
    setValue("selectedTags", tags);
  };
  /**
   * Handles the click clear callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickClear = () => {
    setValue("selectedTags", []);
  };
  /**
   * Handles the click tag callback for the deck feature.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const onClickTag = (value: string[]) => {
    setValue("selectedTags", value);
  };

  return {
    scoreMax: scoreMax ?? null,
    scoreMin: scoreMin ?? null,
    scoreMaxSwitchProps: {
      name: "scoreMaxSwitch",
      checked: scoreMax != null,
      onChange: (event) => {
        setValue("scoreMax", event.currentTarget.checked ? 0 : null);
      },
    },
    scoreMinSwitchProps: {
      name: "scoreMinSwitch",
      checked: scoreMin != null,
      onChange: (event) => {
        setValue("scoreMin", event.currentTarget.checked ? 0 : null);
      },
    },
    scoreMaxSliderProps: {
      ...register("scoreMax", { valueAsNumber: true }),
      step: 1,
      max: 10,
      min: -10,
      disabled: scoreMax == null,
    },
    scoreMinSliderProps: {
      ...register("scoreMin", { valueAsNumber: true }),
      step: 1,
      max: 10,
      min: -10,
      disabled: scoreMin == null,
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
