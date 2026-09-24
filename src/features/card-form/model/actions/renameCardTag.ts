import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";

export function renameCardTag(
  index: number,
  name: string,
  getValues: UseFormGetValues<CardContentInput>,
  setValue: UseFormSetValue<CardContentInput>
): void {
  setValue(
    "tags",
    getValues("tags").map((tag, position) => (position === index ? name : tag)),
    {
      shouldDirty: true,
      shouldValidate: true,
    }
  );
}
