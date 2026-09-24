import type { Dispatch, SetStateAction } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";

export function addCardTag(
  name: string,
  getValues: UseFormGetValues<CardContentInput>,
  setValue: UseFormSetValue<CardContentInput>,
  setTagRowIds: Dispatch<SetStateAction<string[]>>
): void {
  const rowId = crypto.randomUUID();
  setTagRowIds((ids) => [...ids, rowId]);
  setValue("tags", [...getValues("tags"), name], { shouldDirty: true, shouldValidate: true });
}
