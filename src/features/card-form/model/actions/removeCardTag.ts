import type { Dispatch, SetStateAction } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";

export function removeCardTag(
  index: number,
  getValues: UseFormGetValues<CardContentInput>,
  setValue: UseFormSetValue<CardContentInput>,
  setTagRowIds: Dispatch<SetStateAction<string[]>>
): void {
  setTagRowIds((ids) => ids.filter((_, position) => position !== index));
  setValue(
    "tags",
    getValues("tags").filter((_, position) => position !== index),
    {
      shouldDirty: true,
      shouldValidate: true,
    }
  );
}
