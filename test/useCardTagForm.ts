import { type UseFormReturn, useWatch } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";
import {
  addCardTag,
  renameCardTag,
  removeCardTag,
  selectCardTag,
  useCardTagState,
  getCardTagOptions,
} from "@/features/card-form";

export function useCardTagForm(form: UseFormReturn<CardContentInput>) {
  const tagValues = useWatch({ control: form.control, name: "tags" });
  const { tagRowIds, setTagRowIds } = useCardTagState(form.getValues("tags"));
  return {
    tagRowIds,
    tagOptions: getCardTagOptions([], tagValues),
    onAddTag: () => addCardTag("", form.getValues, form.setValue, setTagRowIds),
    onRenameTag: (index: number, name: string) => renameCardTag(index, name, form.getValues, form.setValue),
    onRemoveTag: (index: number) => removeCardTag(index, form.getValues, form.setValue, setTagRowIds),
    onSelectTag: (tag: string, selected: boolean) =>
      selectCardTag({ name: tag, selected }, form.getValues, form.setValue, setTagRowIds),
  };
}
