/**
 * @file Provides the deck-filter feature's Deck filter state hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Deck } from "@/entities/deck";

import React from "react";
import { useForm, useWatch } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { editDeck } from "@/entities/deck";
import { discardPromise } from "@/shared/lib/discardPromise";
import type { DeckFilterForm } from "../ui/DeckFilterForm";

type DeckFilterFormProps = React.ComponentProps<typeof DeckFilterForm>;

export interface UseDeckFilterStateOptions {
  deck: Deck;
  tags: string[];
}

/**
 * Provides the form state and persistence callback used to edit a Deck's card filters.
 */
export const useDeckFilterState = ({ deck, tags }: UseDeckFilterStateOptions): DeckFilterFormProps => {
  const uid = useAuthUid();
  const [scoreMaxEnabled, setScoreMaxEnabled] = React.useState(deck.scoreMax != null);
  const [scoreMinEnabled, setScoreMinEnabled] = React.useState(deck.scoreMin != null);
  const { control, handleSubmit, register, setValue, subscribe } = useForm<Deck>({ defaultValues: deck });
  const scoreMax = useWatch({ control, name: "scoreMax" });
  const scoreMin = useWatch({ control, name: "scoreMin" });
  const selectedTags = useWatch({ control, name: "selectedTags" });
  const tagAndFilter = useWatch({ control, name: "tagAndFilter" });

  React.useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => {
          discardPromise(handleSubmit((data) => editDeck(uid, data).catch(() => undefined))());
        },
      }),
    [handleSubmit, subscribe, uid]
  );

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
