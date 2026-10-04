import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CardContentInput } from "@/entities/card";

export function renameCardTag(
  { index, name, trim = false }: { index: number; name: string; trim?: boolean },
  getValues: UseFormGetValues<CardContentInput>,
  setValue: UseFormSetValue<CardContentInput>
): void {
  setValue(
    "tags",
    getValues("tags").map((tag, position) => (position === index ? (trim ? name.trim() : name) : tag)),
    {
      shouldDirty: true,
      shouldValidate: true,
    }
  );
}
