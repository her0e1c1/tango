import { omitUndefined } from "@/shared/lib/omitUndefined";
import type { EditStudyProgressInput } from "../model/types";

export function mapStudyProgressPatch(fields: Omit<EditStudyProgressInput["progress"], "cardId">, updatedAt: number) {
  return omitUndefined({
    ...fields,
    updatedAt,
  });
}
