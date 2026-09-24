import type { Dispatch, SetStateAction } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";
import { addCardTag } from "./addCardTag";

export function selectCardTag(
  { name, selected }: { name: string; selected: boolean },
  getValues: UseFormGetValues<CardContentInput>,
  setValue: UseFormSetValue<CardContentInput>,
  setTagRowIds: Dispatch<SetStateAction<string[]>>
): void {
  const tags = getValues("tags");
  if (selected) {
    if (!tags.includes(name)) addCardTag(name, getValues, setValue, setTagRowIds);
    return;
  }
  setTagRowIds((ids) => ids.filter((_, index) => tags[index] !== name));
  setValue(
    "tags",
    tags.filter((tag) => tag !== name),
    { shouldDirty: true, shouldValidate: true }
  );
}
