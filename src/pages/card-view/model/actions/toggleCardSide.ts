import type { Dispatch, SetStateAction } from "react";

export function toggleCardSide(setShowBackText: Dispatch<SetStateAction<boolean>>): void {
  setShowBackText((value) => !value);
}
